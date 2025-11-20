const TelegramBot = require('node-telegram-bot-api');
const Withdrawal = require('./models/Withdrawal');
const User = require('./models/User');
const Ad = require('./models/Ad'); // لإضافة إعلانات

// استيراد بوت المستخدمين (لإرسال الإشعارات لهم)
const userBot = require('./userBot');

// 2. توكن بوت الإدارة (الجديد من BotFather)
const token = '8395295117:AAFshMR9fK46kSYL4GpKYYcpORXRJOENwzk'; 
const ADMIN_ID = '2140385904'; // معرفك أنت فقط

const adminBot = new TelegramBot(token, { polling: true });

// حماية البوت
adminBot.on('message', (msg) => {
    if (msg.from.id.toString() !== ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "⛔ غير مصرح لك.");
    }
});

// القائمة الرئيسية للمدير
adminBot.onText(/\/start/, (msg) => {
    if (msg.from.id.toString() === ADMIN_ID) {
        adminBot.sendMessage(msg.chat.id, "👑 **غرفة التحكم**", {
            "reply_markup": {
                "keyboard": [["📥 الطلبات المعلقة", "📊 الإحصائيات"], ["➕ إضافة إعلان"]],
                "resize_keyboard": true
            }
        });
    }
});

// منطق المدير
adminBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (chatId.toString() !== ADMIN_ID) return;

    if (text === "📥 الطلبات المعلقة") {
        const withdrawals = await Withdrawal.find({ status: 'Pending' }).populate('user');
        if (withdrawals.length === 0) return adminBot.sendMessage(chatId, "✅ لا توجد طلبات.");
        
        for (const w of withdrawals) {
            const msgInfo = `👤 ${w.user.username}\n💰 ${w.amount} د.ج\n🏦 ${w.paymentMethod}\n📝 \`${w.accountDetails}\``;
            adminBot.sendMessage(chatId, msgInfo, {
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{ text: "✅ دفع", callback_data: `ok_${w._id}` }, { text: "❌ رفض", callback_data: `no_${w._id}` }]] }
            });
        }
    }
});

// معالجة قرارات المدير
adminBot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;

    if (data.startsWith('ok_')) {
        const wId = data.split('_')[1];
        const w = await Withdrawal.findById(wId).populate('user');
        if (w && w.status === 'Pending') {
            w.status = 'Paid';
            await w.save();
            
            adminBot.editMessageText("✅ تم الدفع.", { chat_id: chatId, message_id: query.message.message_id });
            
            // 🔥 السحر هنا: بوت الإدارة يأمر بوت المستخدمين بإرسال رسالة
            const userTgId = w.user.username.replace('Tg_', ''); // استخراج المعرف
            try {
                userBot.sendMessage(userTgId, `🎉 **مبروك!**\nتمت الموافقة على سحب ${w.amount} د.ج.`);
            } catch (e) { console.log("لم يتمكن من مراسلة المستخدم"); }
        }
    }
});

console.log("👑 Admin Bot is running...");
