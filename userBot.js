const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');

// توكن بوت المستخدمين (القديم أو الأساسي)
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 
const bot = new TelegramBot(token, { polling: true });

// --- (نفس دوال getOrCreateUser والقوائم السابقة بدون تغيير) ---

const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["💎 مهام وإعلانات حقيقية", "👤 حسابي"],
            ["💸 طلب سحب الأرباح", "📞 الدعم"]
        ],
        "resize_keyboard": true
    }
};

const cancelMenu = { "reply_markup": { "keyboard": [["❌ إلغاء"]], "resize_keyboard": true } };
const userStates = {};

// --- الأوامر ---
bot.onText(/\/start/, async (msg) => {
    // (نفس منطق الترحيب)
    bot.sendMessage(msg.chat.id, "مرحباً بك في AdGain Pro! 🇩🇿", mainMenu);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // ... (منطق عرض الحساب والمهام - كما في الكود السابق) ...
    
    if (text === "💸 طلب سحب الأرباح") {
        // بدء عملية السحب
        userStates[chatId] = { step: 'WAITING_AMOUNT' };
        bot.sendMessage(chatId, "💰 أدخل المبلغ المراد سحبه (الحد الأدنى 500 د.ج):", cancelMenu);
    }

    // ... (بقية معالجة خطوات السحب: المبلغ، الطريقة، الحساب) ...
    // الفرق الوحيد هنا: عند الانتهاء، لا نرسل رسالة للمدير هنا.
    // بل نحفظ الطلب في قاعدة البيانات فقط، وبوت الإدارة سيكتشفه.
});

// تصدير البوت لنستخدمه في إرسال الإشعارات من AdminBot
module.exports = bot;
