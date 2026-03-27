const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
export const ADMIN_CHAT_ID = import.meta.env.VITE_ADMIN_CHAT_ID || '';

export const sendTelegramMessage = async (chatId: string, text: string, replyMarkup?: any) => {
    if (!BOT_TOKEN) {
        console.error('Telegram Bot Token is not configured. Set VITE_TELEGRAM_BOT_TOKEN in .env');
        return null;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup
            }),
            signal: controller.signal
        });
        clearTimeout(id);
        return await response.json();
    } catch (error) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('Telegram request timed out');
            throw new Error('TIMEOUT');
        }
        console.error('Error sending Telegram message:', error);
        return null;
    }
};
