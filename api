const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jmiknovgrcpmlbjryckf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('Bot is running!');
    }

    const { message } = req.body;
    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === '/start') {
        await sendTelegramMessage(chatId, "👋 Сәлем! Отправь мне 6-значный код подтверждения с сайта izde contest.");
        return res.status(200).send('OK');
    }

    if (/^\d{6}$/.test(text)) {
        const code = text;
        const { data: users, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            await sendTelegramMessage(chatId, "❌ Ошибка системы.");
            return res.status(200).send('OK');
        }

        const targetUser = users.users.find(u => u.user_metadata && u.user_metadata.verify_code === code);

        if (targetUser) {
            await supabase.auth.admin.updateUserById(targetUser.id, {
                email_confirm: true,
                user_metadata: { ...targetUser.user_metadata, tg_verified: true, verify_code: null }
            });

            await sendTelegramMessage(chatId, `✅ Аккаунт ${targetUser.email} успешно верифицирован! Можете вернуться на сайт.`);
        } else {
            await sendTelegramMessage(chatId, "❌ Неверный или истекший код.");
        }
    } else {
        await sendTelegramMessage(chatId, "Введите 6-значный цифровой код с сайта.");
    }

    return res.status(200).send('OK');
};

async function sendTelegramMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
    });
}
