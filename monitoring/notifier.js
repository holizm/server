export const notifier = ({
    botToken,
    chatId,
}) => {
    if (!botToken || !chatId) {
        throw new Error('telegramBotToken and telegramChatId are required')
    }

    const send = async message => {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            body: new URLSearchParams({
                chat_id: chatId,
                text: message,
            }),
            method: 'POST',
        })
        const result = await response.json()
        if (!result.ok) {
            throw new Error('Telegram rejected the message')
        }
    }

    const result = { send }
    return result
}
