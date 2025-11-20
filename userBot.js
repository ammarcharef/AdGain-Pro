const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task');
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// 1. الإعدادات والتهيئات
// **************************************************
const token = process.env.TELEGRAM_TOKEN_USER; 

// إنشاء البوت بدون Polling
const bot = new TelegramBot(token); 
const userStates = {}; 
const MIN_WITHDRAWAL = 500;
const mainMenu = { /* ... (نفس القائمة السابقة) ... */ };
const cancelMenu = { /* ... (نفس قائمة الإلغاء السابقة) ... */ };

// **************************************************
// 2. الدوال المساعدة (Helpers)
// **************************************************
// ... (دوال getOrCreateUser, showAds, showTasks) ... (يجب أن تكون موجودة)

// **************************************************
// 3. دالة عملية السحب (State Machine)
// **************************************************
async function handleWithdrawalFlow(chatId, text, msg) {
    // ... (منطق السحب الكامل كما في الكود السابق) ...
    // ... (هنا يتم التحقق من المبلغ وحفظ الطلب في MongoDB) ...
    
    // لإكمال الملف بشكل دقيق (تم وضع هذا المنطق بالكامل في الردود السابقة)
    const state = userStates[chatId];
    if (text === "❌ إلغاء") { delete userStates[chatId]; bot.sendMessage(chatId, "تم الإلغاء.", mainMenu); return; }

    // ... (بقية منطق Amount, Method, Account) ...
}

// **************************************************
// 4. المشغلات (LISTENERS) - تبقى كما هي
// **************************************************

// معالج الأوامر النصية والـ state machine
bot.on('message', async (msg) => {
    // ... (منطق معالجة الرسائل النصية) ...
    if (userStates[msg.chat.id]) {
        handleWithdrawalFlow(msg.chat.id, msg.text, msg);
        return;
    }
    // ... (بقية منطق الرسائل) ...
});

// معالج النقرات (Callback Queries)
bot.on('callback_query', async (query) => {
    // ... (منطق معالجة نقرات الإعلانات والمهام) ...
});

// تصدير البوت - هذا حاسم لكي يتمكن server.js من إعداد Webhook
module.exports = bot;
