const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Withdrawal = require('./models/Withdrawal');

// ضع التوكن الخاص بك هنا (أو استخدم process.env.TELEGRAM_TOKEN للأمان)
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

const bot = new TelegramBot(token, { polling: true });

// --- دالة مساعدة: العثور على المستخدم أو إنشاؤه ---
async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || "User";
    const username = msg.from.username || `Tg_${telegramId}`; // اسم مستخدم مؤقت

    // البحث عن المستخدم بواسطة معرف تليجرام (نخزنه في حقل username أو ننشئ حقلاً جديداً، هنا سنستخدم username للتبسيط)
    // ملاحظة: لدمج أفضل، يفضل إضافة حقل telegramId في نموذج User، لكن سنستخدم username مؤقتاً للسرعة.
    let user = await User.findOne({ username: `Tg_${telegramId}` });

    if (!user) {
        // إنشاء مستخدم جديد خاص بتليجرام
        user = new User({
            username: `Tg_${telegramId}`,
            email: `${telegramId}@telegram.bot`, // إيميل وهمي للتوثيق
            password: "telegram_auto_pass", // كلمة مرور عشوائية
            withdrawalAccount: "غير محدد", // يطلب منه التحديث لاحقاً
            balance: 0,
            xp: 0,
            level: 1
        });
        await user.save();
    }
    return user;
}

// --- القائمة الرئيسية ---
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["💰 عرض الإعلانات", "👤 حسابي"],
            ["💸 سحب الأرباح", "ℹ️ حول"]
        ],
        "resize_keyboard": true
    }
};

// --- 1. أمر البداية /start ---
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await getOrCreateUser(msg);
        bot.sendMessage(chatId, `👋 مرحباً بك يا ${msg.from.first_name} في AdGain Pro!\n\n🇩🇿 المنصة الجزائرية الأولى للربح من الإعلانات.\n\nرصيدك الحالي: ${user.balance.toFixed(2)} د.ج`, mainMenu);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "حدث خطأ في الاتصال بقاعدة البيانات.");
    }
});

// --- 2. معالجة الأزرار ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "👤 حسابي") {
        const user = await getOrCreateUser(msg);
        const nextLevelXP = 100 * Math.pow(user.level, 1.5);
        
        const profileMsg = `
👤 **الملف الشخصي:**
🆔 المعرف: ${user.username}
💰 الرصيد: **${user.balance.toFixed(2)} د.ج**
⭐ المستوى: ${user.level}
✨ الخبرة: ${user.xp} / ${Math.floor(nextLevelXP)} XP
🏦 حساب السحب: ${user.withdrawalAccount}
        `;
        bot.sendMessage(chatId, profileMsg, { parse_mode: "Markdown" });
    } 
    
    else if (text === "💰 عرض الإعلانات") {
        try {
            // جلب الإعلانات النشطة
            const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).limit(5);
            
            if (ads.length === 0) {
                bot.sendMessage(chatId, "😔 لا توجد إعلانات متاحة حالياً، حاول لاحقاً.");
                return;
            }

            bot.sendMessage(chatId, "👇 إليك الإعلانات المتاحة، اضغط للمشاهدة والربح:");

            ads.forEach(ad => {
                bot.sendMessage(chatId, `📺 **${ad.title}**\n💵 المكافأة: ${ad.rewardAmount} د.ج\n⏱ المدة: ${ad.viewDuration} ثانية`, {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🔗 فتح الإعلان", url: ad.url },
                            { text: "✅ تأكيد المشاهدة (استلم الربح)", callback_data: `view_${ad._id}` }
                        ]]
                    }
                });
            });

        } catch (error) {
            bot.sendMessage(chatId, "خطأ في جلب الإعلانات.");
        }
    }

    else if (text === "💸 سحب الأرباح") {
        const user = await getOrCreateUser(msg);
        if (user.balance < 500) {
            bot.sendMessage(chatId, `⚠️ رصيدك غير كافٍ للسحب.\nالحد الأدنى: 500 د.ج\nرصيدك: ${user.balance.toFixed(2)} د.ج`);
        } else {
            bot.sendMessage(chatId, "لطلب السحب، يرجى استخدام الموقع الإلكتروني لضمان أمان بياناتك وتحديد طريقة الدفع:\nhttps://adgainpro.web.app/withdraw.html");
        }
    }

    else if (text === "ℹ️ حول") {
        bot.sendMessage(chatId, "AdGain Pro - بوت الربح من مشاهدة الإعلانات.\nكل الحقوق محفوظة 2025.");
    }
});

// --- 3. معالجة النقر على "تأكيد المشاهدة" (Callback Query) ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('view_')) {
        const adId = data.split('_')[1];
        
        try {
            const ad = await Ad.findById(adId);
            // ملاحظة: في البوت نستخدم msg.from.id للبحث عن المستخدم لأنه لا يوجد req.user
            // سنفترض هنا البحث بنفس طريقة getOrCreateUser
            const telegramId = query.from.id.toString();
            const user = await User.findOne({ username: `Tg_${telegramId}` });

            if (!ad || !user) {
                bot.answerCallbackQuery(query.id, { text: "خطأ: الإعلان أو المستخدم غير موجود." });
                return;
            }

            if (ad.remainingViews <= 0) {
                bot.answerCallbackQuery(query.id, { text: "عذراً، انتهت مشاهدات هذا الإعلان." });
                return;
            }

            // إضافة المكافأة
            user.balance += ad.rewardAmount;
            user.xp += 5; // نقاط خبرة
            user.levelUp(); // التحقق من المستوى
            
            // خصم مشاهدة
            ad.remainingViews -= 1;

            await user.save();
            await ad.save();

            // حذف رسالة الإعلان لتجنب التكرار أو تحديثها
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ **تمت المشاهدة بنجاح!**\n💰 ربحت: ${ad.rewardAmount} د.ج\nرصيدك الجديد: ${user.balance.toFixed(2)} د.ج`, { parse_mode: "Markdown" });

        } catch (error) {
            console.error(error);
            bot.answerCallbackQuery(query.id, { text: "حدث خطأ أثناء معالجة المكافأة." });
        }
    }
});

console.log("Telegram Bot is running...");
