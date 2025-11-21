const TelegramBot = require('node-telegram-bot-api');
// ... (بقية الاستيرادات) ...

const token = process.env.TELEGRAM_TOKEN_ADMIN; 
const ADMIN_ID = process.env.ADMIN_ID; 

const adminBot = new TelegramBot(token, { polling: true });

// حماية البوت
adminBot.on('message', (msg) => {
    if (msg.from.id.toString() !== ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "⛔ غير مصرح لك باستخدام هذا النظام.");
        return; 
    }
});

// ... (بقية منطق /admin و معالجة طلبات السحب والموافقة) ...

module.exports = adminBot;