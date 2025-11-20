const TelegramBot = require('node-telegram-bot-api');
const Withdrawal = require('./models/Withdrawal');
const User = require('./models/User');
const userBot = require('./userBot'); // استيراد بوت المستخدمين

// توكن بوت الإدارة (توكن 2 - مختلف)
const token = 'YOUR_ADMIN_BOT_TOKEN_2'; 
const ADMIN_ID = '2140385904'; // معرفك الرقمي

const adminBot = new TelegramBot(token, { polling: true });

// حماية البوت
adminBot.on('message', (msg) => {
    if (msg.from.id.toString() !== ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "⛔ غير مصرح لك باستخدام هذا النظام.");
        return; 
    }
});

// --- أوامر المدير (/admin) ---
adminBot.onText(/\/start|\/admin/, async (msg) => {
    if (msg.from.id.toString() !== ADMIN_ID) return;

    const pendingCount = await Withdrawal.countDocuments({ status: 'Pending' });
    // ... (جلب الإحصائيات الأخرى) ...
    
    adminBot.sendMessage(msg.chat.id, `👑 **لوحة التحكم**\n📄 طلبات معلقة: ${pendingCount}`, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "💸 مراجعة الطلبات", callback_data: "admin_check_withdrawals" }]
            ]
        }
    });
});

// --- منطق الموافقة (Callback Query) ---
adminBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // 1. عرض الطلبات المعلقة
    if (data === 'admin_check_withdrawals') {
        // ... (منطق عرض قائمة السحب) ...
    }

    // 2. الموافقة (التحويل الفعلي)
    else if (data.startsWith('approve_')) {
        const wId = data.split('_')[1];
        const withdrawal = await Withdrawal.findById(wId).populate('user');
        
        if (withdrawal && withdrawal.status === 'Pending') {
            withdrawal.status = 'Paid';
            await withdrawal.save();

            // إشعار المستخدم عبر البوت الآخر
            const userTgId = withdrawal.user.telegramId; 
            try {
                // إرسال الرسالة عبر بوت المستخدمين
                userBot.sendMessage(userTgId, `🎉 **مبروك!**\nتمت الموافقة على سحب ${withdrawal.amount} د.ج.`);
            } catch (e) {}

            adminBot.editMessageText(`✅ **تم تأكيد الدفع وتسجيله.**`, { chat_id: chatId, message_id: query.message.message_id });
        }
    }
});
