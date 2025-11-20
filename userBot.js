// ... (بقية الملف)

// قم بتعريف رابط الاستضافة (Firebase) هنا
const FRONTEND_URL = 'https://adgainpro.web.app'; 

// القوائم (Keyboards) - تم تعديلها لاستخدام Web App
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            [{ text: "📺 لوحة التحكم (الويب)", web_app: { url: `${FRONTEND_URL}/dashboard.html` } }, 
             { text: "💸 سحب الأرباح (الويب)", web_app: { url: `${FRONTEND_URL}/withdraw.html` } }],
            ["👤 حسابي", "📞 الدعم"] // هذه الأزرار تبقى كأوامر شات
        ],
        "resize_keyboard": true
    }
};

// ... (بقية منطق البوت)

// قم بتحديث أمر /start لاستخدام القائمة الجديدة
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await getOrCreateUser(msg);
        bot.sendMessage(chatId, `👋 **أهلاً بك!**\nالآن يمكنك استخدام واجهة الويب مباشرة في البوت.`, { parse_mode: "Markdown", ...mainMenu });
    } catch (e) { console.error(e); }
});

// ... (يجب حذف أي منطق كان يعالج أزرار: "📺 مشاهدة الإعلانات" و "💸 سحب الأرباح" النصية القديمة من دالة bot.on('message', ...) لأنها استبدلت بـ Web Apps)
