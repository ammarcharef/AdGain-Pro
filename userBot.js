const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task');
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// 1. الإعدادات والتهيئات
// **************************************************
// قراءة التوكن من متغيرات البيئة (Render)
const token = process.env.TELEGRAM_TOKEN_USER; 
const bot = new TelegramBot(token, { polling: true }); // Polling for ease of setup

const userStates = {}; // لتتبع حالة المستخدم في عملية السحب
const MIN_WITHDRAWAL = 500;
const FRONTEND_URL = 'https://adgainpro.web.app'; // رابط Firebase Hosting

// القوائم (Keyboards)
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            [{ text: "📺 لوحة التحكم (الويب)", web_app: { url: `${FRONTEND_URL}/dashboard.html` } }],
            ["👤 حسابي", "💸 سحب الأرباح"],
            ["🔗 دعوة الأصدقاء", "📞 الدعم"]
        ],
        "resize_keyboard": true
    }
};

const cancelMenu = { "reply_markup": { "keyboard": [["❌ إلغاء"]], "resize_keyboard": true } };


// **************************************************
// 2. الدوال المساعدة (HELPERS)
// **************************************************

async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || "User";
    const username = msg.from.username || `Tg_${telegramId}`; 
    
    let referrerId = null;
    if (msg.text && msg.text.startsWith('/start') && msg.text.split(' ').length > 1) {
        const refCode = msg.text.split(' ')[1];
        if (refCode !== telegramId) {
            const referrer = await User.findOne({ referralCode: refCode });
            if (referrer) referrerId = referrer.telegramId;
        }
    }

    let user = await User.findOne({ telegramId: telegramId });

    if (!user) {
        user = new User({
            username: username,
            telegramId: telegramId,
            firstName: firstName,
            balance: 0,
            xp: 0,
            level: 1,
            referralCode: telegramId,
            referredBy: referrerId
        });
        await user.save();
    }
    return user;
}

// **************************************************
// 3. دوال العرض والكسب
// **************************************************

async function showAds(chatId) {
    try {
        const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).limit(5);
        if (ads.length === 0) return bot.sendMessage(chatId, "🚫 لا توجد إعلانات متاحة حالياً.");
        
        bot.sendMessage(chatId, "👇 اختر إعلاناً للمشاهدة:", { parse_mode: "Markdown" });
        ads.forEach(ad => {
            bot.sendMessage(chatId, `📺 **${ad.title}**\n💰 الربح: ${ad.rewardAmount} د.ج`, {
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{ text: "🔗 فتح الرابط", url: ad.url }, { text: "✅ استلام المكافأة", callback_data: `claim_ad_${ad._id}` }]] }
            });
        });
    } catch (err) { console.error(err); }
}

async function showTasks(chatId) {
    try {
        const tasks = await Task.find({ isActive: true, remainingCompletions: { $gt: 0 } }).limit(3);
        if (tasks.length === 0) return bot.sendMessage(chatId, "🚫 لا توجد مهام متاحة حالياً.");

        bot.sendMessage(chatId, "👇 أنجز المهام التالية لربح أكبر:", { parse_mode: "Markdown" });
        tasks.forEach(task => {
            bot.sendMessage(chatId, `📋 **${task.title}**\n💰 الربح: ${task.rewardAmount} د.ج`, {
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{ text: "🔗 رابط المهمة", url: task.instructionUrl }, { text: "✅ تأكيد الإنجاز", callback_data: `claim_task_${task._id}` }]] }
            });
        });
    } catch (err) { console.error(err); }
}

// **************************************************
// 4. دالة عملية السحب (State Machine)
// **************************************************

async function handleWithdrawalFlow(chatId, text, msg) {
    const state = userStates[chatId];

    if (text === "❌ إلغاء") {
        delete userStates[chatId];
        bot.sendMessage(chatId, "تم إلغاء العملية.", mainMenu);
        return;
    }

    const user = await getOrCreateUser(msg);

    if (state.step === 'AMOUNT') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount < MIN_WITHDRAWAL || amount > user.balance) {
            return bot.sendMessage(chatId, "⚠️ المبلغ يجب أن يكون رقماً ولا يقل عن 500. حاول مجدداً:");
        }
        state.amount = amount;
        state.step = 'METHOD';
        bot.sendMessage(chatId, "🏦 اختر الطريقة (اكتب): CCP, BaridiMob, PayPal", cancelMenu);
    } 
    
    else if (state.step === 'METHOD') {
        const method = text.toUpperCase().trim();
        if (!['CCP', 'BARIDIMOB', 'PAYPAL'].includes(method)) {
            return bot.sendMessage(chatId, "⚠️ طريقة غير مدعومة. اكتب: CCP أو BaridiMob أو PayPal");
        }
        state.method = method;
        state.step = 'ACCOUNT';
        bot.sendMessage(chatId, "📝 أدخل رقم الحساب والاسم الكامل:", cancelMenu);
    }

    else if (state.step === 'ACCOUNT') {
        const accountDetails = text;
        
        try {
            // تنفيذ العملية النهائية
            user.balance -= state.amount;
            await user.save();

            const withdrawal = new Withdrawal({
                user: user._id,
                amount: state.amount,
                paymentMethod: state.method,
                accountDetails: accountDetails,
                status: 'Pending'
            });
            await withdrawal.save();

            bot.sendMessage(chatId, "✅ تم إرسال الطلب بنجاح! سيتم الدفع قريباً.", mainMenu);
            
            // إشعار المدير (يجب أن يتم إرساله من AdminBot)
            
        } catch (e) {
            bot.sendMessage(chatId, "حدث خطأ تقني. يرجى المحاولة لاحقاً.", mainMenu);
        }
        delete userStates[chatId];
    }
}


// **************************************************
// 5. المشغلات (LISTENERS)
// **************************************************

// 1. أمر /start (التعديل الخاص بـ Mini App)
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await getOrCreateUser(msg);
        
        // إرسال زر التشغيل الفوري للـ Mini App
        const webAppButton = {
            reply_markup: {
                inline_keyboard: [
                    [{ 
                        text: "🚀 ابدأ الكسب الآن!", 
                        web_app: { url: `${FRONTEND_URL}/dashboard.html` } 
                    }]
                ]
            }
        };

        bot.sendMessage(chatId, 
            `👋 **مرحباً بك يا ${user.firstName} في AdGain Pro!** 🇩🇿\n\nاضغط على الزر أدناه للانتقال إلى واجهة التطبيق المصغرة.`,
            { parse_mode: "Markdown", reply_markup: webAppButton.reply_markup }
        );
        
        // إظهار القائمة الرئيسية بعد فترة وجيزة
        setTimeout(() => {
            bot.sendMessage(chatId, "أو استخدم القائمة السفلية للتنقل:", mainMenu);
        }, 1500);

    } catch (error) {
        console.error(error);
    }
});

// 2. معالجة الرسائل النصية
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    if (userStates[chatId]) {
        handleWithdrawalFlow(chatId, text, msg);
        return;
    }

    if (text === "👤 حسابي") { /* ... */ }
    else if (text === "📺 مشاهدة الإعلانات") { showAds(chatId); }
    else if (text === "📋 المهام") { showTasks(chatId); }
    else if (text === "💸 سحب الأرباح") {
        const user = await getOrCreateUser(msg);
        if (user.balance < 500) {
            bot.sendMessage(chatId, `⚠️ رصيدك غير كافٍ. الحد الأدنى: 500 د.ج`);
        } else {
            userStates[chatId] = { step: 'AMOUNT' };
            bot.sendMessage(chatId, "💰 أدخل المبلغ المراد سحبه (مثال: 500):", cancelMenu);
        }
    }
    // ... (بقية منطق الرسائل) ...
});


// 3. معالج النقرات (Callback Queries)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = query.from.id.toString();

    // منع المعالجة إذا لم يكن هناك بيانات
    if (!data) return bot.answerCallbackQuery(query.id, { text: "خطأ في البيانات" });


    // --- معالجة المطالبات (Claims) ---
    const user = await User.findOne({ telegramId: userId });

    if (data.startsWith('claim_ad_')) {
        // ... (منطق إضافة رصيد الإعلان) ...
        const adId = data.split('_')[2];
        const ad = await Ad.findById(adId);
        if (ad && ad.remainingViews > 0 && user) {
            user.balance += ad.rewardAmount; ad.remainingViews -= 1;
            await user.save(); await ad.save();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ ربحت ${ad.rewardAmount} د.ج!`);
        }
    }
    else if (data.startsWith('claim_task_')) {
        // ... (منطق إضافة رصيد المهام) ...
        const taskId = data.split('_')[2];
        const task = await Task.findById(taskId);
        if (task && task.remainingCompletions > 0 && user) {
            user.balance += task.rewardAmount; task.remainingCompletions -= 1;
            await user.save(); await task.save();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ أكملت المهمة! ربحت ${task.rewardAmount} د.ج.`);
        }
    }
});

module.exports = bot;
