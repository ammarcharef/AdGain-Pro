const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task'); 
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// إعدادات البوت
// **************************************************

// ضع التوكن الخاص بك هنا
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

// معرف تليجرام الخاص بك (المدير) لاستلام إشعارات السحب
const ADMIN_CHAT_ID = '2140385904'; 

const bot = new TelegramBot(token, { polling: true });

// متغير لتتبع حالة المستخدم (لسيناريو السحب)
const userStates = {};

// **************************************************
// دوال المساعدة
// **************************************************

async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const username = msg.from.username || `Tg_${telegramId}`; 
    
    // التحقق من الإحالة
    let referrerId = null;
    if (msg.text && msg.text.startsWith('/start') && msg.text.split(' ').length > 1) {
        const refCode = msg.text.split(' ')[1];
        const referrer = await User.findOne({ referralCode: refCode });
        if (referrer && referrer.username !== `Tg_${telegramId}`) {
            referrerId = referrer._id;
        }
    }

    let user = await User.findOne({ username: `Tg_${telegramId}` });

    if (!user) {
        user = new User({
            username: `Tg_${telegramId}`,
            email: `${telegramId}@telegram.bot`,
            password: "tg_auto_pass",
            withdrawalAccount: "غير محدد",
            balance: 0,
            xp: 0,
            level: 1,
            referralCode: telegramId,
            referredBy: referrerId
        });
        await user.save();
    }
    return user;
}

// القوائم
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["📺 مشاهدة الإعلانات", "📋 المهام المصغرة"],
            ["👤 حسابي", "💸 سحب الأرباح"],
            ["🔗 رابط الدعوة", "📞 الدعم"]
        ],
        "resize_keyboard": true
    }
};

const cancelMenu = {
    "reply_markup": {
        "keyboard": [["❌ إلغاء"]],
        "resize_keyboard": true
    }
};

// **************************************************
// الأوامر والرسائل
// **************************************************

// 1. البداية /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await getOrCreateUser(msg);
        bot.sendMessage(chatId, `👋 أهلاً بك يا ${msg.from.first_name} في AdGain Pro!\n\nاربح المال بسهولة من هاتفك. 🇩🇿`, mainMenu);
    } catch (error) {
        console.error(error);
    }
});

// 2. لوحة تحكم المدير /admin
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id.toString();

    if (chatId !== ADMIN_CHAT_ID) {
        bot.sendMessage(chatId, "⛔ هذا الأمر مخصص للمدير فقط.");
        return;
    }

    try {
        const totalUsers = await User.countDocuments();
        const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
        const activeAds = await Ad.countDocuments({ isActive: true });

        const statsMsg = `
👑 **لوحة تحكم المدير**

👥 المستخدمين: ${totalUsers}
📄 طلبات السحب المعلقة: ${pendingWithdrawals}
📺 الإعلانات النشطة: ${activeAds}
        `;

        bot.sendMessage(chatId, statsMsg, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💸 مراجعة طلبات السحب", callback_data: "admin_check_withdrawals" }]
                ]
            }
        });
    } catch (error) {
        bot.sendMessage(chatId, "حدث خطأ في جلب البيانات.");
    }
});

// 3. معالجة الرسائل النصية
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) return; // تجاهل الأوامر

    // --- معالجة خطوات السحب ---
    if (userStates[chatId]) {
        handleWithdrawalFlow(chatId, text, msg);
        return;
    }

    // --- القائمة الرئيسية ---
    if (text === "👤 حسابي") {
        const user = await getOrCreateUser(msg);
        bot.sendMessage(chatId, `👤 **حسابي:**\n🆔 المعرف: \`${user.referralCode}\`\n💰 الرصيد: **${user.balance.toFixed(2)} د.ج**`, { parse_mode: "Markdown" });
    }
    else if (text === "🔗 رابط الدعوة") {
        const user = await getOrCreateUser(msg);
        const refLink = `https://t.me/${(await bot.getMe()).username}?start=${user.referralCode}`;
        bot.sendMessage(chatId, `🎁 شارك واربح!\n${refLink}`);
    }
    else if (text === "📺 مشاهدة الإعلانات") {
        showAds(chatId);
    }
    else if (text === "📋 المهام المصغرة") {
        showTasks(chatId);
    }
    else if (text === "💸 سحب الأرباح") {
        startWithdrawal(chatId, msg);
    }
    else if (text === "📞 الدعم") {
        bot.sendMessage(chatId, "للتواصل مع الإدارة: @YourSupportUsername");
    }
});

// **************************************************
// دوال المنطق
// **************************************************

async function showAds(chatId) {
    try {
        const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).limit(5);
        if (ads.length === 0) {
            bot.sendMessage(chatId, "🚫 لا توجد إعلانات متاحة حالياً.");
            return;
        }
        bot.sendMessage(chatId, "👇 اختر إعلاناً للمشاهدة:");
        ads.forEach(ad => {
            bot.sendMessage(chatId, `📺 **${ad.title}**\n💰 الربح: ${ad.rewardAmount} د.ج`, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔗 فتح الرابط", url: ad.url },
                        { text: "✅ استلام المكافأة", callback_data: `ad_${ad._id}` }
                    ]]
                }
            });
        });
    } catch (err) { console.error(err); }
}

async function showTasks(chatId) {
    try {
        const tasks = await Task.find({ isActive: true, remainingCompletions: { $gt: 0 } }).limit(3);
        if (tasks.length === 0) {
            bot.sendMessage(chatId, "🚫 لا توجد مهام متاحة.");
            return;
        }
        bot.sendMessage(chatId, "👇 أنجز المهام التالية:");
        tasks.forEach(task => {
            bot.sendMessage(chatId, `📋 **${task.title}**\n📝 ${task.description}\n💰 الربح: ${task.rewardAmount} د.ج`, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔗 رابط المهمة", url: task.instructionUrl },
                        { text: "✅ تأكيد الإنجاز", callback_data: `task_${task._id}` }
                    ]]
                }
            });
        });
    } catch (err) { console.error(err); }
}

// --- منطق السحب ---
async function startWithdrawal(chatId, msg) {
    const user = await getOrCreateUser(msg);
    if (user.balance < 500) {
        bot.sendMessage(chatId, `⚠️ رصيدك غير كافٍ.\nالحد الأدنى: 500 د.ج\nرصيدك: ${user.balance.toFixed(2)} د.ج`);
        return;
    }
    userStates[chatId] = { step: 'WAITING_AMOUNT' };
    bot.sendMessage(chatId, "💰 أدخل المبلغ الذي تريد سحبه (مثال: 500):", cancelMenu);
}

async function handleWithdrawalFlow(chatId, text, msg) {
    if (text === "❌ إلغاء") {
        delete userStates[chatId];
        bot.sendMessage(chatId, "تم إلغاء العملية.", mainMenu);
        return;
    }

    const state = userStates[chatId];

    if (state.step === 'WAITING_AMOUNT') {
        const amount = parseFloat(text);
        const user = await getOrCreateUser(msg);
        if (isNaN(amount) || amount < 500 || user.balance < amount) {
            bot.sendMessage(chatId, "⚠️ مبلغ غير صحيح أو رصيد غير كافٍ. حاول مجدداً:");
            return;
        }
        state.amount = amount;
        state.step = 'WAITING_METHOD';
        bot.sendMessage(chatId, "🏦 اختر الطريقة (اكتب): CCP, BaridiMob, PayPal", cancelMenu);
    } 
    else if (state.step === 'WAITING_METHOD') {
        state.method = text;
        state.step = 'WAITING_ACCOUNT';
        bot.sendMessage(chatId, "📝 أدخل رقم الحساب والاسم:", cancelMenu);
    }
    else if (state.step === 'WAITING_ACCOUNT') {
        const accountDetails = text;
        const user = await getOrCreateUser(msg);
        
        user.balance -= state.amount;
        await user.save();

        const withdrawal = new Withdrawal({
            user: user._id,
            amount: state.amount,
            paymentMethod: state.method,
            accountDetails: accountDetails,
            status: 'Pending'
        });
        await withdrawal.save();

        bot.sendMessage(chatId, "✅ تم استلام طلبك بنجاح!", mainMenu);
        if (ADMIN_CHAT_ID) {
            bot.sendMessage(ADMIN_CHAT_ID, `🚨 **طلب سحب جديد**\nمن: ${user.username}\nمبلغ: ${state.amount}`);
        }
        delete userStates[chatId];
    }
}

// **************************************************
// معالجة جميع النقرات (Callbacks) - للمدير والمستخدم
// **************************************************
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const telegramId = query.from.id.toString();

    // 1. معالجة الإعلانات
    if (data.startsWith('ad_')) {
        const adId = data.split('_')[1];
        try {
            const ad = await Ad.findById(adId);
            const user = await User.findOne({ username: `Tg_${telegramId}` });

            if (ad && ad.remainingViews > 0 && user) {
                user.balance += ad.rewardAmount;
                ad.remainingViews -= 1;
                await user.save();
                await ad.save();
                bot.deleteMessage(chatId, query.message.message_id);
                bot.sendMessage(chatId, `✅ ربحت ${ad.rewardAmount} د.ج!`);
            } else {
                bot.answerCallbackQuery(query.id, { text: "خطأ أو انتهى الإعلان." });
            }
        } catch (e) {}
    }

    // 2. معالجة المهام
    else if (data.startsWith('task_')) {
        const taskId = data.split('_')[1];
        try {
            const task = await Task.findById(taskId);
            const user = await User.findOne({ username: `Tg_${telegramId}` });

            if (task && task.remainingCompletions > 0 && user) {
                user.balance += task.rewardAmount;
                task.remainingCompletions -= 1;
                await user.save();
                await task.save();
                bot.deleteMessage(chatId, query.message.message_id);
                bot.sendMessage(chatId, `✅ أكملت المهمة! ربحت ${task.rewardAmount} د.ج.`);
            } else {
                bot.answerCallbackQuery(query.id, { text: "المهمة غير متاحة." });
            }
        } catch (e) {}
    }

    // 3. لوحة المدير: عرض الطلبات
    else if (data === 'admin_check_withdrawals') {
        if (chatId.toString() !== ADMIN_CHAT_ID) return;
        const withdrawals = await Withdrawal.find({ status: 'Pending' }).populate('user');
        
        if (withdrawals.length === 0) {
            bot.sendMessage(chatId, "✅ لا توجد طلبات معلقة.");
        } else {
            withdrawals.forEach(w => {
                bot.sendMessage(chatId, `👤 ${w.user ? w.user.username : 'Unknown'}\n💰 ${w.amount} د.ج\n🏦 ${w.paymentMethod}\n📝 ${w.accountDetails}`, {
                    reply_markup: { inline_keyboard: [[{ text: "✅ دفع", callback_data: `approve_${w._id}` }, { text: "❌ رفض", callback_data: `reject_${w._id}` }]] }
                });
            });
        }
    }

    // 4. لوحة المدير: الموافقة
    else if (data.startsWith('approve_')) {
        if (chatId.toString() !== ADMIN_CHAT_ID) return;
        const wId = data.split('_')[1];
        const withdrawal = await Withdrawal.findById(wId).populate('user');
        if (withdrawal && withdrawal.status === 'Pending') {
            withdrawal.status = 'Paid';
            await withdrawal.save();
            bot.editMessageText("✅ تم الدفع.", { chat_id: chatId, message_id: query.message.message_id });
            
            // إشعار المستخدم
            const userTgId = withdrawal.user.username.replace('Tg_', '');
            bot.sendMessage(userTgId, `🎉 تم دفع مبلغ ${withdrawal.amount} د.ج لحسابك!`);
        }
    }

    // 5. لوحة المدير: الرفض
    else if (data.startsWith('reject_')) {
        if (chatId.toString() !== ADMIN_CHAT_ID) return;
        const wId = data.split('_')[1];
        const withdrawal = await Withdrawal.findById(wId).populate('user');
        if (withdrawal && withdrawal.status === 'Pending') {
            withdrawal.status = 'Rejected';
            await withdrawal.save();
            withdrawal.user.balance += withdrawal.amount; // إعادة الرصيد
            await withdrawal.user.save();
            bot.editMessageText("❌ تم الرفض وإعادة الرصيد.", { chat_id: chatId, message_id: query.message.message_id });
            
            // إشعار المستخدم
            const userTgId = withdrawal.user.username.replace('Tg_', '');
            bot.sendMessage(userTgId, `⚠️ تم رفض طلب السحب وإعادة الرصيد.`);
        }
    }
});

console.log("Telegram Bot is running...");
