const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// 1. الإعدادات والتهيئات
// **************************************************
const token = process.env.TELEGRAM_TOKEN_ADMIN; 
const ADMIN_ID = process.env.ADMIN_ID; 

// إنشاء البوت بدون Polling
const adminBot = new TelegramBot(token); 

// **************************************************
// 2. منطق المدير (ADMIN LOGIC) - بدون تغيير
// **************************************************
adminBot.onText(/\/start|\/admin/, async (msg) => {
    // ... (منطق لوحة التحكم والإحصائيات) ...
    if (msg.from.id.toString() !== ADMIN_ID) return; 

    // ... (جلب الإحصائيات وعرض القائمة) ...
});

// ... (بقية منطق المدير مثل onMessage و onCallbackQuery لـ 'admin_check_withdrawals' و 'approve_') ...

// **************************************************
// 3. تصدير البوت
// **************************************************
module.exports = adminBot;
