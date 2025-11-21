const TelegramBot = require('node-telegram-bot-api');
// ... (بقية الاستيرادات) ...

const token = process.env.TELEGRAM_TOKEN_USER; 
const bot = new TelegramBot(token, { polling: true }); 
const userStates = {}; 
const MIN_WITHDRAWAL = 500;

// ... (بقية منطق getOrCreateUser، والقوائم، ومنطق showAds و showTasks) ...

// هذا الملف هو قلب تفاعلات المستخدمين (يحتوي على الدوال الكاملة للتفاعل مع الأزرار)

module.exports = bot;