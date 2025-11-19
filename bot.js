const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User'); // استخدام نفس نموذج المستخدم الخاص بك!

// استبدل هذا بالتوكن الذي حصلت عليه من BotFather
// (للأمان، يفضل وضعه في Environment Variables في Render لاحقاً، لكن للسرعة ضعه هنا مؤقتاً)
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

// إنشاء البوت (Polling يعني أن البوت يتحقق من الرسائل باستمرار)
const bot = new TelegramBot(token, {polling: true});

// رسالة الترحيب /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || "Unknown";

    // هنا يمكنك التحقق مما إذا كان المستخدم مسجلاً في MongoDB أم لا
    // وإنشاء حساب له تلقائياً باستخدام Telegram ID
    bot.sendMessage(chatId, `مرحباً بك يا ${username} في AdGain Pro! 🇩🇿\n\nرصيدك الحالي: 0.00 د.ج\n\nاستخدم القائمة للربح.`, {
        "reply_markup": {
            "keyboard": [["💰 عرض الإعلانات", "👤 حسابي"], ["💸 سحب الأرباح"]]
        }
    });
});

// الاستماع لأزرار القائمة
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === "💰 عرض الإعلانات") {
        // هنا يمكنك جلب الإعلانات من MongoDB (مجموعة ads)
        bot.sendMessage(chatId, "جاري البحث عن إعلانات متاحة... (سيتم الربط بقاعدة البيانات)");
    } 
    else if (msg.text === "👤 حسابي") {
        bot.sendMessage(chatId, "بيانات حسابك: ...");
    }
});

console.log("Telegram Bot is running...");
