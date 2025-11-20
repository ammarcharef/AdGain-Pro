const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const Ad = require('./models/Ad');
const Task = require('./models/Task');
const Withdrawal = require('./models/Withdrawal');

// **************************************************
// 1. الإعدادات والتهيئات
// **************************************************
// قراءة التوكن من متغيرات البيئة (Render)
const token = process.env.TELEGRAM_TOKEN_USER; 

const bot = new TelegramBot(token, { polling: true });
const userStates = {}; 
const MIN_WITHDRAWAL = 500;

// ... (بقية دوال المساعدة، القوائم، إلخ)

// **************************************************
// 2. دوال المساعدة (Helpers - يجب أن تكون موجودة)
// **************************************************

async function getOrCreateUser(msg) {
    const telegramId = msg.from.id.toString();
    const username = msg.from.username || `Tg_${telegramId}`; 
    let referrerId = null;
    
    if (msg.text && msg.text.startsWith('/start') && msg.text.split(' ').length > 1) {
        const refCode = msg.text.split(' ')[1];
        if (refCode !== telegramId) {
            const referrer = await User.findOne({ referralCode: refCode });
            if (referrer) referrerId = referrer.telegramId;
        }
    }

    let user = await User.findOne({ telegramId: telegramId });

    if (!user) {
        user = new User({
            username: username,
            telegramId: telegramId,
            firstName: msg.from.first_name || "User",
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

// ... (دوال showAds, showTasks, initiateWithdrawal) ...

// **************************************************
// 3. دالة عملية السحب (State Machine Logic)
// **************************************************

async function handleWithdrawalFlow(chatId, text, msg) {
    const state = userStates[chatId];
    if (text === "❌ إلغاء") {
        delete userStates[chatId];
        return bot.sendMessage(chatId, "تم إلغاء العملية.");
    }

    const user = await getOrCreateUser(msg);

    if (state.step === 'AMOUNT') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount < MIN_WITHDRAWAL || amount > user.balance) {
            return bot.sendMessage(chatId, "⚠️ مبلغ غير صحيح. حاول مجدداً:");
        }
        state.amount = amount;
        state.step = 'METHOD';
        bot.sendMessage(chatId, "🏦 اختر الطريقة (اكتب كتابة): CCP, BaridiMob, PayPal");
    } 
    
    else if (state.step === 'METHOD') {
        state.method = text;
        state.step = 'ACCOUNT';
        bot.sendMessage(chatId, "📝 أدخل رقم الحساب والاسم الكامل:", cancelMenu);
    }

    else if (state.step === 'ACCOUNT') {
        const accountDetails = text;
        try {
            // خصم وحفظ الطلب
            user.balance -= state.amount;
            await user.save();
            const withdrawal = new Withdrawal({ user: user._id, amount: state.amount, paymentMethod: state.method, accountDetails: accountDetails, status: 'Pending' });
            await withdrawal.save();

            bot.sendMessage(chatId, `✅ تم إرسال الطلب بنجاح! سيتم الدفع قريباً.`, mainMenu);
            
            // إشعار المدير (يتم التعامل معه الآن عبر AdminBot)
            // بما أن هذا الملف ليس هو المسؤول عن الإشعارات، سنقوم بإزالة استدعاءه
            
        } catch (e) { bot.sendMessage(chatId, "حدث خطأ تقني.", mainMenu); }
        delete userStates[chatId];
    }
}

// ... (بقية المشغلات onText, onMessage, onCallbackQuery) ...

module.exports = bot;
