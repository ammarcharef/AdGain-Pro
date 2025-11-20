const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task'); 
const Withdrawal = require('./models/Withdrawal');

// *********************************************
// 1. الإعدادات (توكن واحد ومعرف واحد للمدير)
// *********************************************
const token = process.env.TELEGRAM_TOKEN_USER; // يجب تعيينه في Render
const ADMIN_ID = process.env.ADMIN_ID; // معرفك الشخصي

const bot = new TelegramBot(token, { polling: true });

const userStates = {}; 
const MIN_WITHDRAWAL = 500;

// *********************************************
// 2. دوال المساعدة (Helpers)
// *********************************************

async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    // ... (منطق إنشاء أو جلب المستخدم) ...
    let user = await User.findOne({ telegramId: telegramId });
    if (!user) {
        user = new User({
            telegramId: telegramId,
            username: msg.from.username || `Tg_${telegramId}`,
            firstName: msg.from.first_name || "User",
            withdrawalAccount: "غير محدد",
            referralCode: telegramId
        });
        await user.save();
    }
    return user;
}

// القوائم
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["📺 مشاهدة الإعلانات", "📋 المهام"],
            ["👤 حسابي", "💸 سحب الأرباح"],
            ["🔗 دعوة الأصدقاء", "📞 الدعم"],
            [{ text: "👑 لوحة المدير", hide: true }] // زر مخفي للمدير فقط
        ],
        "resize_keyboard": true
    }
};

const cancelMenu = { "reply_markup": { "keyboard": [["❌ إلغاء"]], "resize_keyboard": true } };


// *********************************************
// 3. منطق السحب (State Machine)
// *********************************************

async function handleWithdrawalFlow(chatId, text, msg) {
    const state = userStates[chatId];
    if (text === "❌ إلغاء") { delete userStates[chatId]; bot.sendMessage(chatId, "تم الإلغاء.", mainMenu); return; }

    const user = await getOrCreateUser(msg);

    if (state.step === 'AMOUNT') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount < MIN_WITHDRAWAL || amount > user.balance) {
            return bot.sendMessage(chatId, "⚠️ المبلغ يجب أن يكون رقماً ولا يقل عن 500.");
        }
        state.amount = amount;
        state.step = 'METHOD';
        bot.sendMessage(chatId, "🏦 اختر الطريقة (اكتب): CCP, BaridiMob, PayPal", cancelMenu);
    } 
    else if (state.step === 'METHOD') {
        // ... (منطق التحقق من الطريقة)
        state.method = text;
        state.step = 'ACCOUNT';
        bot.sendMessage(chatId, "📝 أدخل رقم الحساب والاسم الكامل:", cancelMenu);
    }
    else if (state.step === 'ACCOUNT') {
        // تنفيذ العملية النهائية
        user.balance -= state.amount;
        await user.save();
        const withdrawal = new Withdrawal({ user: user._id, amount: state.amount, paymentMethod: state.method, accountDetails: text, status: 'Pending' });
        await withdrawal.save();

        bot.sendMessage(chatId, "✅ تم إرسال الطلب بنجاح! سيتم الدفع قريباً.", mainMenu);
        
        // إشعار المدير
        bot.sendMessage(ADMIN_ID, `🚨 **طلب سحب جديد!**\n👤 المستخدم: ${user.username}\n💰 المبلغ: ${state.amount} د.ج`);
        
        delete userStates[chatId];
    }
}

// *********************************************
// 4. المشغلات (LISTENERS)
// *********************************************

// أمر المدير السري /admin (للوحة التحكم)
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== ADMIN_ID) return bot.sendMessage(chatId, "⛔ هذا الأمر خاص.");

    const pendingCount = await Withdrawal.countDocuments({ status: 'Pending' });
    const usersCount = await User.countDocuments();
    
    bot.sendMessage(chatId, `👑 **لوحة تحكم المدير**\n👥 المستخدمين: ${usersCount}\n📄 طلبات معلقة: ${pendingCount}`, {
        reply_markup: { inline_keyboard: [[{ text: "💸 مراجعة الطلبات", callback_data: "admin_check_withdrawals" }]] }
    });
});

// ... (بقية منطق onText و onMessage و callback_query للمستخدمين والمدير)

console.log("🤖 Bot is running...");
