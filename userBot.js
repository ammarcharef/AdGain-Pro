const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task');
const Withdrawal = require('./models/Withdrawal');

// 1. توكن بوت المستخدمين (القديم)
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 
const bot = new TelegramBot(token, { polling: true });

// متغيرات الحالة (لسيناريو السحب)
const userStates = {};

// ... (ضع هنا دوال getOrCreateUser والقوائم mainMenu كما كانت) ...
// ... (ضع هنا منطق /start و message و callback_query الخاص بالمستخدم فقط) ...

// مثال سريع لمنطق السحب (للتأكد من حفظه):
async function startWithdrawal(chatId, msg) {
    // ... نفس الكود السابق ...
    // عند الانتهاء من الطلب، فقط نحفظه في DB ولا نرسل للمدير هنا
    // المدير سيراه في البوت الثاني
}

// تصدير البوت ليستخدمه الأدمن في الإشعارات
module.exports = bot; 

console.log("✅ User Bot is running...");
