export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Bot is running!');
    }

    try {
        const SUPABASE_URL = 'https://jmiknovgrcpmlbjryckf.supabase.co';
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

        if (!SUPABASE_SERVICE_KEY || !TELEGRAM_BOT_TOKEN) {
            return res.status(200).json({ error: 'Missing environment variables' });
        }

        const { message } = req.body;
        if (!message || !message.text) {
            return res.status(200).json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text.trim();

        if (text === '/start') {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "👋 Сәлем! Отправьте мне 6-значный код подтверждения с сайта izde contest.");
            return res.status(200).json({ ok: true });
        }

        if (/^\d{6}$/.test(text)) {
            const code = text;

            const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            });

            const result = await response.json();
            const users = result.users || [];
            const targetUser = users.find(u => u.user_metadata && u.user_metadata.verify_code === code);

            if (targetUser) {
                await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${targetUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email_confirm: true,
                        user_metadata: { ...targetUser.user_metadata, tg_verified: true, verify_code: null }
                    })
                });

                await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, `✅ Аккаунт ${targetUser.email} успешно верифицирован! Можете вернуться на сайт.`);
            } else {
                await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Неверный или истекший код. Проверьте код на сайте.");
            }
        } else {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "Введите 6-значный цифровой код с сайта.");
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(200).json({ ok: false, error: err.message });
    }
}

async function sendTelegramMessage(token, chatId, text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
    });
}
