const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task'); 
const Withdrawal = require('./models/Withdrawal');

// ============================================================
// 1. إعدادات البوت (CONFIGURATION)
// ============================================================
// ضع التوكن الخاص بك هنا
const token = '8294794453:AAHDM0ujjbKZrJsA53Oh844Rfa8BxCwTAGc'; 

// ضع معرفك الرقمي (Telegram ID) هنا لتكون أنت المدير الوحيد
const ADMIN_ID = '2140385904'; 

// إنشاء نسخة البوت
const bot = new TelegramBot(token, { polling: true });

// تتبع حالة المستخدمين (لعمليات السحب المتسلسلة)
const userStates = {};

// ============================================================
// 2. دوال المساعدة (HELPER FUNCTIONS)
// ============================================================

// دالة للحصول على المستخدم أو إنشائه
async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || "User";
    
    // التحقق من الإحالة (Deep Linking)
    let referrerId = null;
    if (msg.text && msg.text.startsWith('/start') && msg.text.split(' ').length > 1) {
        const refCode = msg.text.split(' ')[1];
        // التأكد من أن المحيل موجود وليس هو نفس المستخدم
        if (refCode !== telegramId) {
            const referrer = await User.findOne({ referralCode: refCode });
            if (referrer) referrerId = referrer.telegramId;
        }
    }

    let user = await User.findOne({ telegramId: telegramId });

    if (!user) {
        user = new User({
            username: `Tg_${telegramId}`,
            telegramId: telegramId,
            firstName: firstName,
            balance: 0,
            xp: 0,
            level: 1,
            referralCode: telegramId, // استخدام المعرف ككود إحالة
            referredBy: referrerId
        });
        await user.save();
        console.log(`➕ New User Registered: ${firstName} (${telegramId})`);
    }
    return user;
}

// القوائم (Keyboards)
const mainMenu = {
    "reply_markup": {
        "keyboard": [
            ["📺 مشاهدة الإعلانات", "📋 المهام"],
            ["👤 حسابي", "💸 سحب الأرباح"],
            ["🔗 دعوة الأصدقاء", "📞 الدعم"]
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

// ============================================================
// 3. منطق المدير (ADMIN LOGIC) - محمي
// ============================================================

bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id.toString();
    
    // حماية: التحقق من هوية المدير
    if (chatId !== ADMIN_ID) {
        return bot.sendMessage(chatId, "⛔ **غير مصرح:** هذا الأمر مخصص للإدارة فقط.");
    }

    // جلب الإحصائيات الحية
    const usersCount = await User.countDocuments();
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
    const adsCount = await Ad.countDocuments({ isActive: true });

    const statsMsg = `
👑 **غرفة التحكم والقيادة**

📊 **الإحصائيات العامة:**
👥 عدد المستخدمين: \`${usersCount}\`
💸 طلبات السحب المعلقة: \`${pendingWithdrawals}\`
📺 الإعلانات النشطة: \`${adsCount}\`

👇 **إدارة العمليات:**
    `;

    bot.sendMessage(chatId, statsMsg, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "💸 مراجعة طلبات السحب", callback_data: "admin_check_withdrawals" }],
                [{ text: "➕ إضافة إعلان سريع", callback_data: "admin_add_ad_help" }]
            ]
        }
    });
});

// ============================================================
// 4. منطق المستخدم (USER LOGIC)
// ============================================================

// أمر البداية
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await getOrCreateUser(msg);
        bot.sendMessage(chatId, `👋 **مرحباً بك يا ${user.firstName}!**\n\n🇩🇿 في منصة **AdGain Pro**.\nاربح المال الحقيقي من هاتفك عبر مشاهدة الإعلانات وإتمام المهام.`, { parse_mode: "Markdown", ...mainMenu });
    } catch (e) { console.error(e); }
});

// معالجة الرسائل النصية والقوائم
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // تجاهل الأوامر

    // --- فحص حالة السحب (State Machine) ---
    if (userStates[chatId]) {
        handleWithdrawalProcess(chatId, text, msg);
        return;
    }

    // --- الأزرار الرئيسية ---
    if (text === "👤 حسابي") {
        const user = await getOrCreateUser(msg);
        bot.sendMessage(chatId, `
👤 **الملف الشخصي:**
🆔 المعرف: \`${user.telegramId}\`
💰 الرصيد: **${user.balance.toFixed(2)} د.ج**
🏆 المستوى: ${user.level}
        `, { parse_mode: "Markdown" });
    }

    else if (text === "🔗 دعوة الأصدقاء") {
        const user = await getOrCreateUser(msg);
        const botInfo = await bot.getMe();
        const link = `https://t.me/${botInfo.username}?start=${user.referralCode}`;
        bot.sendMessage(chatId, `🎁 **رابط الإحالة الخاص بك:**\n${link}\n\nشارك هذا الرابط واربح 10% من أرباح كل صديق يسجل!`);
    }

    else if (text === "📺 مشاهدة الإعلانات") {
        const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).limit(5);
        if (ads.length === 0) return bot.sendMessage(chatId, "🚫 لا توجد إعلانات متاحة حالياً.");
        
        bot.sendMessage(chatId, "👇 **اختر إعلاناً للمشاهدة:**", { parse_mode: "Markdown" });
        ads.forEach(ad => {
            bot.sendMessage(chatId, `📺 **${ad.title}**\n💰 الربح: ${ad.rewardAmount} د.ج`, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔗 فتح الإعلان", url: ad.url },
                        { text: "✅ استلام المكافأة", callback_data: `claim_ad_${ad._id}` }
                    ]]
                }
            });
        });
    }

    else if (text === "📋 المهام") {
        const tasks = await Task.find({ isActive: true, remainingCompletions: { $gt: 0 } }).limit(3);
        if (tasks.length === 0) return bot.sendMessage(chatId, "🚫 لا توجد مهام متاحة حالياً.");

        bot.sendMessage(chatId, "👇 **المهام المتاحة:**", { parse_mode: "Markdown" });
        tasks.forEach(task => {
            bot.sendMessage(chatId, `📋 **${task.title}**\n📝 ${task.description || ''}\n💰 الربح: ${task.rewardAmount} د.ج`, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔗 رابط المهمة", url: task.instructionUrl },
                        { text: "✅ تأكيد الإنجاز", callback_data: `claim_task_${task._id}` }
                    ]]
                }
            });
        });
    }

    else if (text === "💸 سحب الأرباح") {
        initiateWithdrawal(chatId, msg);
    }

    else if (text === "📞 الدعم") {
        bot.sendMessage(chatId, "📬 للتواصل مع الدعم الفني:\nيرجى مراسلة: @AmmarSupport (مثال)");
    }
});

// ============================================================
// 5. منطق السحب (WITHDRAWAL FLOW)
// ============================================================

async function initiateWithdrawal(chatId, msg) {
    const user = await getOrCreateUser(msg);
    if (user.balance < 500) {
        bot.sendMessage(chatId, `⚠️ **رصيد غير كافٍ**\nالحد الأدنى للسحب هو 500 د.ج.\nرصيدك الحالي: ${user.balance.toFixed(2)} د.ج`, { parse_mode: "Markdown" });
        return;
    }
    userStates[chatId] = { step: 'AMOUNT' };
    bot.sendMessage(chatId, "💰 **طلب سحب جديد**\nأدخل المبلغ الذي تريد سحبه (مثال: 500):", cancelMenu);
}

async function handleWithdrawalProcess(chatId, text, msg) {
    if (text === "❌ إلغاء") {
        delete userStates[chatId];
        bot.sendMessage(chatId, "تم إلغاء العملية.", mainMenu);
        return;
    }

    const state = userStates[chatId];
    const user = await getOrCreateUser(msg);

    if (state.step === 'AMOUNT') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount < 500) {
            bot.sendMessage(chatId, "⚠️ المبلغ يجب أن يكون رقماً ولا يقل عن 500. حاول مجدداً:");
            return;
        }
        if (amount > user.balance) {
            bot.sendMessage(chatId, "⚠️ رصيدك غير كافٍ لهذا المبلغ. حاول مجدداً:");
            return;
        }
        state.amount = amount;
        state.step = 'METHOD';
        bot.sendMessage(chatId, "🏦 **اختر طريقة السحب:**\n(اكتب كتابة أحد الخيارات: CCP, BaridiMob, PayPal)", cancelMenu);
    }

    else if (state.step === 'METHOD') {
        const method = text.toUpperCase().trim();
        if (!['CCP', 'BARIDIMOB', 'PAYPAL'].includes(method)) {
            bot.sendMessage(chatId, "⚠️ طريقة غير صحيحة. يرجى كتابة: CCP أو BaridiMob أو PayPal");
            return;
        }
        state.method = method;
        state.step = 'ACCOUNT';
        bot.sendMessage(chatId, "📝 **أدخل معلومات الحساب:**\n(الاسم الكامل + رقم الحساب/RIP)", cancelMenu);
    }

    else if (state.step === 'ACCOUNT') {
        // تنفيذ العملية النهائية
        try {
            // خصم الرصيد
            user.balance -= state.amount;
            await user.save();

            // حفظ الطلب
            const withdrawal = new Withdrawal({
                user: user._id,
                amount: state.amount,
                paymentMethod: state.method,
                accountDetails: text,
                status: 'Pending'
            });
            await withdrawal.save();

            bot.sendMessage(chatId, `✅ **تم إرسال الطلب بنجاح!**\nسيتم مراجعة طلبك وإرسال الأموال قريباً.`, mainMenu);
            
            // إشعار المدير
            bot.sendMessage(ADMIN_ID, `🚨 **طلب سحب جديد!**\n👤 المستخدم: ${user.username}\n💰 المبلغ: ${state.amount}\n🏦 الطريقة: ${state.method}`);

        } catch (e) {
            console.error(e);
            bot.sendMessage(chatId, "حدث خطأ تقني. يرجى المحاولة لاحقاً.", mainMenu);
        }
        delete userStates[chatId];
    }
}

// ============================================================
// 6. معالج النقرات الموحد (CALLBACK ROUTER)
// ============================================================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = query.from.id.toString();

    // --- أ) مطالبات المستخدم (User Claims) ---
    
    if (data.startsWith('claim_ad_')) {
        const adId = data.split('_')[2];
        try {
            const ad = await Ad.findById(adId);
            const user = await User.findOne({ telegramId: userId });

            if (!ad || ad.remainingViews <= 0) {
                return bot.answerCallbackQuery(query.id, { text: "عذراً، انتهى هذا الإعلان." });
            }
            
            // إضافة الرصيد
            user.balance += ad.rewardAmount;
            ad.remainingViews -= 1;
            
            await user.save();
            await ad.save();

            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ **أحسنت!**\nتمت إضافة ${ad.rewardAmount} د.ج إلى رصيدك.`);
            
        } catch (e) { console.error(e); }
    }

    else if (data.startsWith('claim_task_')) {
        const taskId = data.split('_')[2];
        try {
            const task = await Task.findById(taskId);
            const user = await User.findOne({ telegramId: userId });

            if (!task || task.remainingCompletions <= 0) {
                return bot.answerCallbackQuery(query.id, { text: "عذراً، هذه المهمة غير متاحة." });
            }

            user.balance += task.rewardAmount;
            task.remainingCompletions -= 1;

            await user.save();
            await task.save();

            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, `✅ **ممتاز!**\nأكملت المهمة وربحت ${task.rewardAmount} د.ج.`);

        } catch (e) { console.error(e); }
    }

    // --- ب) عمليات المدير (Admin Operations) ---
    
    // 1. عرض القائمة
    else if (data === 'admin_check_withdrawals') {
        if (chatId.toString() !== ADMIN_ID) return;

        const withdrawals = await Withdrawal.find({ status: 'Pending' }).populate('user');
        if (withdrawals.length === 0) return bot.sendMessage(chatId, "✅ لا توجد طلبات سحب معلقة.");

        withdrawals.forEach(w => {
            const msgInfo = `👤 **طالب السحب:** ${w.user.username}\n💰 **المبلغ:** ${w.amount} د.ج\n🏦 **الطريقة:** ${w.paymentMethod}\n📝 **الحساب:** \`${w.accountDetails}\``;
            bot.sendMessage(chatId, msgInfo, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ تم الدفع", callback_data: `approve_${w._id}` },
                        { text: "❌ رفض", callback_data: `reject_${w._id}` }
                    ]]
                }
            });
        });
    }

    // 2. الموافقة
    else if (data.startsWith('approve_')) {
        if (chatId.toString() !== ADMIN_ID) return;
        const wId = data.split('_')[1];
        
        try {
            const withdrawal = await Withdrawal.findById(wId).populate('user');
            if (withdrawal && withdrawal.status === 'Pending') {
                withdrawal.status = 'Paid';
                await withdrawal.save();

                bot.editMessageText(`✅ **تم تسجيل الدفع بنجاح.**\nالمستخدم: ${withdrawal.user.username}\nالمبلغ: ${withdrawal.amount}`, {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: "Markdown"
                });

                // إشعار المستخدم
                bot.sendMessage(withdrawal.user.telegramId, `🎉 **مبروك!**\nتمت الموافقة على سحب مبلغ ${withdrawal.amount} د.ج.\nشكراً لاستخدامك AdGain Pro.`);
            }
        } catch (e) { console.error(e); }
    }

    // 3. الرفض
    else if (data.startsWith('reject_')) {
        if (chatId.toString() !== ADMIN_ID) return;
        const wId = data.split('_')[1];

        try {
            const withdrawal = await Withdrawal.findById(wId).populate('user');
            if (withdrawal && withdrawal.status === 'Pending') {
                withdrawal.status = 'Rejected';
                await withdrawal.save();

                // إعادة الرصيد
                withdrawal.user.balance += withdrawal.amount;
                await withdrawal.user.save();

                bot.editMessageText(`❌ **تم رفض الطلب وإعادة الرصيد للمستخدم.**`, {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: "Markdown"
                });

                // إشعار المستخدم
                bot.sendMessage(withdrawal.user.telegramId, `⚠️ **تنبيه بخصوص السحب**\nتم رفض طلب السحب الخاص بك وإعادة الرصيد إلى محفظتك.\nيرجى التأكد من صحة معلومات الحساب والمحاولة مجدداً.`);
            }
        } catch (e) { console.error(e); }
    }

    // 4. مساعدة إضافة إعلان
    else if (data === 'admin_add_ad_help') {
        if (chatId.toString() !== ADMIN_ID) return;
        bot.sendMessage(chatId, "لإضافة إعلان يدوياً، استخدم قاعدة بيانات MongoDB Atlas حالياً، أو اطلب من المطور إضافة ميزة 'إضافة إعلان عبر الشات' في التحديث القادم.");
    }
});

console.log("🤖 Telegram Bot System is fully operational...");
