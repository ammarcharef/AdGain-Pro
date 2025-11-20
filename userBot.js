const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task');
const Withdrawal = require('./models/Withdrawal');

// توكن بوت المستخدمين (توكن 1)
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

const bot = new TelegramBot(token, { polling: true });
const userStates = {};

// ... (بقية دوال المساعدة، القوائم، handleWithdrawalFlow، showAds، showTasks) ...
// (يجب أن يحتوي هذا الملف على جميع الدوال التي أرسلتها سابقاً بدون منطق المدير)

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getOrCreateUser(msg); // تأكد من وجود getOrCreateUser
    bot.sendMessage(chatId, `👋 أهلاً بك يا ${user.firstName}!`, { parse_mode: "Markdown", ...mainMenu });
});

bot.on('message', async (msg) => {
    // ... (منطق معالجة الرسائل العادي) ...
});

bot.on('callback_query', async (query) => {
    // ... (منطق معالجة نقرات الإعلانات والمهام) ...
});

module.exports = bot; // مهم لتصدير البوت ليستخدمه AdminBot
