const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// 1. الإعدادات والتهيئات
// **************************************************
// قراءة التوكن ومعرف المدير من متغيرات البيئة
const token = process.env.TELEGRAM_TOKEN_ADMIN; 
const ADMIN_ID = process.env.ADMIN_ID; 

const adminBot = new TelegramBot(token, { polling: true });

// **************************************************
// 2. منطق المدير (ADMIN LOGIC)
// **************************************************

// حماية البوت
adminBot.on('message', (msg) => {
    if (msg.from.id.toString() !== ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "⛔ غير مصرح لك باستخدام هذا النظام.");
        return; 
    }
});

// الأمر /start و /admin
adminBot.onText(/\/start|\/admin/, async (msg) => {
    const chatId = msg.chat.id.toString();

    if (chatId !== ADMIN_ID) return;

    // جلب الإحصائيات الحية
    const pendingCount = await Withdrawal.countDocuments({ status: 'Pending' });
    const usersCount = await User.countDocuments();
    // ... (جلب إحصائيات أخرى) ...

    const statsMsg = `
👑 **لوحة تحكم المدير**

📊 **الإحصائيات:**
👥 عدد المستخدمين: \`${usersCount}\`
💸 طلبات السحب المعلقة: \`${pendingCount}\`
    `;

    adminBot.sendMessage(chatId, statsMsg, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "💸 مراجعة الطلبات", callback_data: "admin_check_withdrawals" }]
            ]
        }
    });
});

// --- معالجة النقرات (Callbacks) ---
adminBot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;

    if (chatId.toString() !== ADMIN_ID) return; // حماية إضافية

    // 1. عرض قائمة الطلبات المعلقة
    if (data === 'admin_check_withdrawals') {
        const withdrawals = await Withdrawal.find({ status: 'Pending' }).populate('user');
        
        if (withdrawals.length === 0) return adminBot.sendMessage(chatId, "✅ لا توجد طلبات معلقة.");

        withdrawals.forEach(w => {
            const msgInfo = `
👤 المستخدم: ${w.user.username}
💰 المبلغ: ${w.amount} د.ج
🏦 الطريقة: ${w.paymentMethod}
📝 الحساب: \`${w.accountDetails}\`
            `;
            adminBot.sendMessage(chatId, msgInfo, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ تم الدفع", callback_data: `approve_${w._id}` }, 
                         { text: "❌ رفض", callback_data: `reject_${w._id}` }]
                    ]
                }
            });
        });
    }

    // 2. الموافقة (Approval)
    else if (data.startsWith('approve_')) {
        const wId = data.split('_')[1];
        const withdrawal = await Withdrawal.findById(wId).populate('user');
        
        if (withdrawal && withdrawal.status === 'Pending') {
            withdrawal.status = 'Paid';
            await withdrawal.save();

            adminBot.editMessageText(`✅ **تم تأكيد الدفع وتسجيله.**\nالمبلغ: ${withdrawal.amount}`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown" });
            
            // 🔥 إشعار المستخدم (بما أننا لا نستخدم userBot هنا مباشرة، هذه مجرد محاولة إرسال)
            // (يجب أن يتم هذا عبر توكن userBot لضمان وصول الرسالة، لكننا نعتمد على أن userBot يعمل في الخلفية.)
            
        }
    }
    // ... (بقية منطق الرفض)
});
