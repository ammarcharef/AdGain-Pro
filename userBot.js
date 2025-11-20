const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task');
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// 1. الإعدادات والتهيئات
// **************************************************

// توكن بوت المستخدمين (توكن 1)
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

const bot = new TelegramBot(token, { polling: true });
const userStates = {}; // لتتبع حالة المستخدم في عملية السحب

// القوائم (Keyboards)
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["📺 مشاهدة الإعلانات", "📋 المهام"],
            ["👤 حسابي", "💸 سحب الأرباح"],
            ["🔗 دعوة الأصدقاء", "📞 الدعم"]
        ],
        "resize_keyboard": true
    }
};

const cancelMenu = { "reply_markup": { "keyboard": [["❌ إلغاء"]], "resize_keyboard": true } };
const MIN_WITHDRAWAL = 500;

// **************************************************
// 2. الدوال المساعدة (HELPERS)
// **************************************************

async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || "User";
    const username = msg.from.username || `Tg_${telegramId}`; 
    
    // التحقق من الإحالة (Deep Linking)
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
// 3. دوال منطق العرض والكسب
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
            bot.sendMessage(chatId, "⚠️ المبلغ غير صحيح. الحد الأدنى 500 د.ج. حاول مجدداً:");
            return;
        }
        state.amount = amount;
        state.step = 'METHOD';
        bot.sendMessage(chatId, "🏦 اختر الطريقة (اكتب كتابة):\n\nCCP\nBaridiMob\nPayPal", cancelMenu);
    } 
    
    else if (state.step === 'METHOD') {
        const method = text.toUpperCase().trim();
        if (!['CCP', 'BARIDIMOB', 'PAYPAL'].includes(method)) {
            bot.sendMessage(chatId, "⚠️ طريقة غير مدعومة. اكتب: CCP أو BaridiMob أو PayPal:");
            return;
        }
        state.method = method;
        state.step = 'ACCOUNT';
        bot.sendMessage(chatId, `📝 أدخل رقم حساب ${method} الخاص بك والاسم الكامل:`, cancelMenu);
    }

    else if (state.step === 'ACCOUNT') {
        const accountDetails = text;
        
        try {
            // تنفيذ السحب النهائي
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

            bot.sendMessage(chatId, `✅ **تم استلام طلبك بنجاح!**\n\nالمبلغ: ${state.amount} د.ج\nالحساب: ${accountDetails}\n\nسيتم الدفع خلال 48 ساعة.`, mainMenu);
            
            // يجب أن يرسل الإشعار للمدير عبر AdminBot (تم التعامل معها في adminBot.js)
        } catch (err) {
            bot.sendMessage(chatId, "حدث خطأ أثناء المعالجة. حاول لاحقاً.", mainMenu);
        }
        
        delete userStates[chatId];
    }
}


// **************************************************
// 5. المشغلات (LISTENERS)
// **************************************************

// معالجة الرسائل النصية
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // تجاهل الأوامر النصية

    if (userStates[chatId]) {
        handleWithdrawalFlow(chatId, text, msg);
        return;
    }

    // الأوامر الرئيسية
    if (text === "👤 حسابي") { /* ... (منطق عرض الحساب) ... */ }
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

// معالجة النقرات (Callback Queries)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = query.from.id.toString();

    // 1. معالجة الإعلانات
    if (data.startsWith('claim_ad_')) {
        const adId = data.split('_')[2];
        const ad = await Ad.findById(adId);
        const user = await User.findOne({ telegramId: userId });

        if (ad && ad.remainingViews > 0 && user) {
            user.balance += ad.rewardAmount;
            ad.remainingViews -= 1;
            await user.save();
            await ad.save();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ ربحت ${ad.rewardAmount} د.ج!`);
        }
    }
    // 2. معالجة المهام
    else if (data.startsWith('claim_task_')) {
        const taskId = data.split('_')[2];
        const task = await Task.findById(taskId);
        const user = await User.findOne({ telegramId: userId });

        if (task && task.remainingCompletions > 0 && user) {
            user.balance += task.rewardAmount;
            task.remainingCompletions -= 1;
            await user.save();
            await task.save();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ أكملت المهمة! ربحت ${task.rewardAmount} د.ج.`);
        }
    }
});

module.exports = bot;
