const BOT_TOKEN = '8764951043:AAH2e6mXv0XqhlIcw6D2Lc--0THeBKL35Gs';
// The user will replace this with their Chat ID soon, but for now we use a placeholder or export a function to set it
export const sendTelegramMessage = async (chatId: string, text: string, replyMarkup?: any) => {
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
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return null;
    }
};
