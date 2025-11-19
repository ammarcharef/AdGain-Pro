const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task'); // تأكد من وجود model للمهام
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// إعدادات البوت
// **************************************************
// استبدل هذا بالتوكن الخاص بك
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

// معرف تليجرام الخاص بك (المدير) لاستلام إشعارات السحب فوراً
// يمكنك معرفته عن طريق بوت @userinfobot
const ADMIN_CHAT_ID = '2140385904'; 

const bot = new TelegramBot(token, { polling: true });

// متغير لتتبع حالة المستخدم (لسيناريو السحب خطوة بخطوة)
// الصيغة: { chat_id: { step: 'WAITING_AMOUNT' | 'WAITING_ACCOUNT' } }
const userStates = {};

// **************************************************
// دوال المساعدة
// **************************************************

async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || "User";
    const username = msg.from.username || `Tg_${telegramId}`; 
    
    // التحقق من وجود كود إحالة في رسالة البداية (مثل /start 12345)
    let referrerId = null;
    if (msg.text && msg.text.startsWith('/start') && msg.text.split(' ').length > 1) {
        const refCode = msg.text.split(' ')[1];
        const referrer = await User.findOne({ referralCode: refCode });
        if (referrer && referrer.username !== `Tg_${telegramId}`) {
            referrerId = referrer._id;
        }
    }

    let user = await User.findOne({ username: `Tg_${telegramId}` });

    if (!user) {
        user = new User({
            username: `Tg_${telegramId}`,
            email: `${telegramId}@telegram.bot`,
            password: "tg_auto_pass", // لا يهم هنا
            withdrawalAccount: "غير محدد",
            balance: 0,
            xp: 0,
            level: 1,
            referralCode: telegramId, // استخدام معرف تليجرام ككود إحالة للسهولة
            referredBy: referrerId
        });
        await user.save();
        
        // إشعار للمُحيل إذا وجد
        if (referrerId) {
            // (اختياري) يمكن إضافة منطق لإشعار المحيل هنا
        }
    }
    return user;
}

// القوائم (Keyboards)
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["📺 مشاهدة الإعلانات", "📋 المهام المصغرة"],
            ["👤 حسابي", "💸 سحب الأرباح"],
            ["🔗 رابط الدعوة", "📞 الدعم"]
        ],
        "resize_keyboard": true
    }
};

const cancelMenu = {
    "reply_markup": {
        "keyboard": [["❌ إلغاء"]],
        "resize_keyboard": true
    }
};

// **************************************************
// منطق الأوامر والرسائل
// **************************************************

// 1. البداية
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await getOrCreateUser(msg);
        bot.sendMessage(chatId, `👋 أهلاً بك يا ${msg.from.first_name} في منصة AdGain Pro!\n\nاجمع الأرباح من هاتفك بسهولة. 🇩🇿`, mainMenu);
    } catch (error) {
        console.error(error);
    }
});

// 2. الاستماع للرسائل النصية
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // تجاهل أوامر /start لأنها عولجت أعلاه
    if (text && text.startsWith('/start')) return;

    // --- معالجة حالات السحب (State Machine) ---
    if (userStates[chatId]) {
        handleWithdrawalFlow(chatId, text, msg);
        return;
    }

    // --- القائمة الرئيسية ---
    
    if (text === "👤 حسابي") {
        const user = await getOrCreateUser(msg);
        const nextLevelXP = 100 * Math.pow(user.level, 1.5);
        const info = `
👤 **ملف المستخدم:**
🆔 المعرف: \`${user.referralCode}\`
💰 الرصيد: **${user.balance.toFixed(2)} د.ج**
⭐ المستوى: ${user.level}
📈 الخبرة: ${user.xp}/${Math.floor(nextLevelXP)}
        `;
        bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
    }

    else if (text === "🔗 رابط الدعوة") {
        const user = await getOrCreateUser(msg);
        const refLink = `https://t.me/${(await bot.getMe()).username}?start=${user.referralCode}`;
        bot.sendMessage(chatId, `🎁 **شارك واربح!**\n\nرابط الإحالة الخاص بك:\n${refLink}\n\nتحصل على 10% من أرباح كل شخص يسجل عن طريقك!`, { parse_mode: "Markdown" });
    }

    else if (text === "📺 مشاهدة الإعلانات") {
        showAds(chatId);
    }

    else if (text === "📋 المهام المصغرة") {
        showTasks(chatId);
    }

    else if (text === "💸 سحب الأرباح") {
        startWithdrawal(chatId, msg);
    }
    
    else if (text === "📞 الدعم") {
        bot.sendMessage(chatId, "للتواصل مع الإدارة: @YourSupportUsername"); // ضع معرفك هنا
    }
});

// **************************************************
// دوال المنطق (Actions)
// **************************************************

async function showAds(chatId) {
    try {
        const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).limit(5);
        if (ads.length === 0) {
            bot.sendMessage(chatId, "🚫 لا توجد إعلانات متاحة حالياً. عد لاحقاً!");
            return;
        }
        bot.sendMessage(chatId, "👇 اختر إعلاناً للمشاهدة:");
        ads.forEach(ad => {
            bot.sendMessage(chatId, `📺 **${ad.title}**\n💰 الربح: ${ad.rewardAmount} د.ج`, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔗 فتح الرابط", url: ad.url },
                        { text: "✅ استلام المكافأة", callback_data: `ad_${ad._id}` }
                    ]]
                }
            });
        });
    } catch (err) {
        console.error(err);
    }
}

async function showTasks(chatId) {
    try {
        const tasks = await Task.find({ isActive: true, remainingCompletions: { $gt: 0 } }).limit(3);
        if (tasks.length === 0) {
            bot.sendMessage(chatId, "🚫 لا توجد مهام متاحة حالياً.");
            return;
        }
        bot.sendMessage(chatId, "👇 أنجز المهام التالية لربح أكبر:");
        tasks.forEach(task => {
            bot.sendMessage(chatId, `📋 **${task.title}**\n📝 ${task.description}\n💰 الربح: ${task.rewardAmount} د.ج`, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔗 رابط المهمة", url: task.instructionUrl },
                        { text: "✅ تأكيد الإنجاز", callback_data: `task_${task._id}` }
                    ]]
                }
            });
        });
    } catch (err) {
        console.error(err);
    }
}

// --- منطق السحب الداخلي ---

async function startWithdrawal(chatId, msg) {
    const user = await getOrCreateUser(msg);
    if (user.balance < 500) {
        bot.sendMessage(chatId, `⚠️ رصيدك غير كافٍ.\nالحد الأدنى: 500 د.ج\nرصيدك: ${user.balance.toFixed(2)} د.ج`);
        return;
    }
    // بدء حالة السحب
    userStates[chatId] = { step: 'WAITING_AMOUNT' };
    bot.sendMessage(chatId, "💰 **طلب سحب جديد**\n\nأدخل المبلغ الذي تريد سحبه (مثال: 500):", cancelMenu);
}

async function handleWithdrawalFlow(chatId, text, msg) {
    if (text === "❌ إلغاء") {
        delete userStates[chatId];
        bot.sendMessage(chatId, "تم إلغاء العملية.", mainMenu);
        return;
    }

    const state = userStates[chatId];

    if (state.step === 'WAITING_AMOUNT') {
        const amount = parseFloat(text);
        const user = await getOrCreateUser(msg);

        if (isNaN(amount) || amount < 500) {
            bot.sendMessage(chatId, "⚠️ المبلغ غير صحيح. الحد الأدنى 500 د.ج. حاول مجدداً:");
            return;
        }
        if (user.balance < amount) {
            bot.sendMessage(chatId, "⚠️ رصيدك غير كافٍ لهذا المبلغ. حاول مجدداً:");
            return;
        }

        state.amount = amount;
        state.step = 'WAITING_METHOD';
        bot.sendMessage(chatId, "🏦 اختر طريقة السحب (اكتب كتابة):\n\nCCP\nBaridiMob\nPayPal", cancelMenu);
    } 
    
    else if (state.step === 'WAITING_METHOD') {
        const method = text.toUpperCase().trim();
        if (!['CCP', 'BARIDIMOB', 'PAYPAL'].includes(method)) {
            bot.sendMessage(chatId, "⚠️ طريقة غير مدعومة. اكتب: CCP أو BaridiMob أو PayPal:");
            return;
        }
        state.method = method;
        state.step = 'WAITING_ACCOUNT';
        bot.sendMessage(chatId, `📝 أدخل رقم حساب ${method} الخاص بك (الاسم والرقم):`, cancelMenu);
    }

    else if (state.step === 'WAITING_ACCOUNT') {
        const accountDetails = text;
        const user = await getOrCreateUser(msg);
        
        // تنفيذ السحب النهائي
        try {
            // خصم الرصيد
            user.balance -= state.amount;
            await user.save();

            // تسجيل الطلب في DB
            const withdrawal = new Withdrawal({
                user: user._id,
                amount: state.amount,
                paymentMethod: state.method,
                accountDetails: accountDetails,
                status: 'Pending'
            });
            await withdrawal.save();

            bot.sendMessage(chatId, `✅ **تم استلام طلبك بنجاح!**\n\nالمبلغ: ${state.amount} د.ج\nالحساب: ${accountDetails}\n\nسيتم الدفع خلال 48 ساعة.`, mainMenu);
            
            // إشعار المدير (أنت) على تليجرام
            if (ADMIN_CHAT_ID) {
                bot.sendMessage(ADMIN_CHAT_ID, `🚨 **طلب سحب جديد!**\nالمستخدم: ${user.username}\nالمبلغ: ${state.amount}\nالطريقة: ${state.method}\nالحساب: ${accountDetails}`);
            }

        } catch (err) {
            console.error(err);
            bot.sendMessage(chatId, "حدث خطأ أثناء المعالجة. حاول لاحقاً.", mainMenu);
        }
        
        // إنهاء الحالة
        delete userStates[chatId];
    }
}

// --- معالجة النقرات (Callbacks) ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const telegramId = query.from.id.toString();

    // معالجة الإعلانات
    if (data.startsWith('ad_')) {
        const adId = data.split('_')[1];
        try {
            const ad = await Ad.findById(adId);
            const user = await User.findOne({ username: `Tg_${telegramId}` });

            if (!ad || ad.remainingViews <= 0) {
                bot.answerCallbackQuery(query.id, { text: "انتهى هذا الإعلان." });
                return;
            }
            
            // إضافة الرصيد
            user.balance += ad.rewardAmount;
            user.xp += 5;
            user.levelUp();
            ad.remainingViews -= 1;
            
            await user.save();
            await ad.save();

            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ ربحت ${ad.rewardAmount} د.ج!`);
        } catch (e) { console.error(e); }
    }

    // معالجة المهام
    if (data.startsWith('task_')) {
        const taskId = data.split('_')[1];
        try {
            const task = await Task.findById(taskId);
            const user = await User.findOne({ username: `Tg_${telegramId}` });
            
            // منطق مبسط للمهام (يمكن تعقيده لاحقاً للتحقق)
            if (!task || task.remainingCompletions <= 0) {
                bot.answerCallbackQuery(query.id, { text: "المهمة غير متاحة." });
                return;
            }

            user.balance += task.rewardAmount;
            user.xp += task.rewardXP;
            task.remainingCompletions -= 1;
            
            await user.save();
            await task.save();

            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ أكملت المهمة! ربحت ${task.rewardAmount} د.ج.`);
        } catch (e) { console.error(e); }
    }
});

console.log("Telegram Bot (Full Platform) is running...");
