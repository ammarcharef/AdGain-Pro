const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');
// استيراد بوت المستخدم لإرسال إشعارات للمستخدمين
const userBot = require('./userBot'); 

// توكن بوت الإدارة (الجديد الذي أنشأته من BotFather)
const token = '8395295117:AAFshMR9fK46kSYL4GpKYYcpORXRJOENwzk'; 

// معرفك أنت فقط (للحماية القصوى)
const MY_ADMIN_ID = '2140385904'; 

const adminBot = new TelegramBot(token, { polling: true });

// حماية البوت: أي شخص غيرك يحاول استخدامه سيتم حظره
adminBot.on('message', (msg) => {
    if (msg.from.id.toString() !== MY_ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "⛔ غير مصرح لك باستخدام هذا النظام.");
        return; // إيقاف التنفيذ
    }
});

// --- القائمة الرئيسية للمدير ---
const adminKeyboard = {
    "reply_markup": {
        "keyboard": [
            ["📥 الطلبات المعلقة", "📊 الإحصائيات"],
            ["📢 رسالة للجميع", "✅ الطلبات المكتملة"]
        ],
        "resize_keyboard": true
    }
};

adminBot.onText(/\/start/, (msg) => {
    if (msg.from.id.toString() === MY_ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "👑 **أهلاً سيدي المدير**\nنظام توزيع الأرباح جاهز.", adminKeyboard);
    }
});

// --- معالجة الأوامر ---
adminBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (chatId.toString() !== MY_ADMIN_ID) return;

    // 1. عرض الطلبات المعلقة (توزيع الأموال)
    if (text === "📥 الطلبات المعلقة") {
        const withdrawals = await Withdrawal.find({ status: 'Pending' }).populate('user');
        
        if (withdrawals.length === 0) {
            adminBot.sendMessage(chatId, "✅ لا توجد طلبات سحب جديدة.");
            return;
        }

        adminBot.sendMessage(chatId, `يوجد ${withdrawals.length} طلبات معلقة.`);

        // عرض كل طلب مع أزرار التحكم
        for (const w of withdrawals) {
            const msgText = `
🆔 المعرف: \`${w._id}\`
👤 المستخدم: ${w.user.username}
💰 المبلغ: **${w.amount} د.ج**
🏦 الطريقة: ${w.paymentMethod}
📝 الحساب: \`${w.accountDetails}\`
            `;
            
            await adminBot.sendMessage(chatId, msgText, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ تم التحويل (موافقة)", callback_data: `approve_${w._id}` },
                        { text: "❌ رفض وإعادة المال", callback_data: `reject_${w._id}` }
                    ]]
                }
            });
        }
    }

    // 2. الإحصائيات
    else if (text === "📊 الإحصائيات") {
        const usersCount = await User.countDocuments();
        const paidWithdrawals = await Withdrawal.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalPaid = paidWithdrawals[0] ? paidWithdrawals[0].total : 0;

        adminBot.sendMessage(chatId, `
📊 **تقرير النظام:**
👥 عدد المستخدمين: ${usersCount}
💸 إجمالي المدفوعات: ${totalPaid} د.ج
        `);
    }
});

// --- تنفيذ الأوامر (Callback Queries) ---
adminBot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;

    // الموافقة على السحب
    if (data.startsWith('approve_')) {
        const wId = data.split('_')[1];
        const withdrawal = await Withdrawal.findById(wId).populate('user');
        
        if (withdrawal && withdrawal.status === 'Pending') {
            withdrawal.status = 'Paid'; // تم الدفع
            withdrawal.processedAt = Date.now();
            await withdrawal.save();

            adminBot.editMessageText(`✅ **تمت الموافقة وتسجيل الدفع.**\nالمبلغ: ${withdrawal.amount}`, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: "Markdown"
            });

            // 🔥 إشعار المستخدم عبر "بوت المستخدمين"
            const userTgId = withdrawal.user.telegramId; // تأكد أنك تخزن telegramId في نموذج المستخدم
            try {
                userBot.sendMessage(userTgId, `🎉 **مبروك!**\n\nتم تحويل مبلغ **${withdrawal.amount} د.ج** إلى حسابك بنجاح.\nشكراً لعملك معنا!`);
            } catch (e) {
                console.error("فشل إرسال رسالة للمستخدم (ربما حظر البوت)");
            }
        }
    }

    // رفض السحب
    if (data.startsWith('reject_')) {
        const wId = data.split('_')[1];
        const withdrawal = await Withdrawal.findById(wId).populate('user');

        if (withdrawal && withdrawal.status === 'Pending') {
            withdrawal.status = 'Rejected';
            await withdrawal.save();

            // إعادة المال للمستخدم
            withdrawal.user.balance += withdrawal.amount;
            await withdrawal.user.save();

            adminBot.editMessageText(`❌ **تم رفض الطلب وإعادة الرصيد.**`, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: "Markdown"
            });

            // إشعار المستخدم
            const userTgId = withdrawal.user.telegramId;
            try {
                userBot.sendMessage(userTgId, `⚠️ **تنبيه:**\nتم رفض طلب السحب الخاص بك وإعادة الرصيد لمحفظتك.\nيرجى التأكد من معلومات الحساب.`);
            } catch (e) {}
        }
    }
});
