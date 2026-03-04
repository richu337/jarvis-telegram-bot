const say = require('say');
const fs = require('fs');
const path = require('path');

async function handleTTS(bot, chatId, text) {
    try {
        bot.sendChatAction(chatId, 'record_voice');
        
        const audioPath = path.join(__dirname, '../../temp', `tts_${Date.now()}.wav`);
        
        if (!fs.existsSync(path.dirname(audioPath))) {
            fs.mkdirSync(path.dirname(audioPath), { recursive: true });
        }
        
        say.export(text, null, 1.0, audioPath, (err) => {
            if (err) {
                console.error('TTS error:', err);
                bot.sendMessage(chatId, '❌ Failed to generate speech.');
                return;
            }
            
            bot.sendVoice(chatId, audioPath, {
                caption: `🔊 "${text}"`
            }).then(() => {
                fs.unlinkSync(audioPath);
            }).catch((error) => {
                console.error('Send voice error:', error);
                bot.sendMessage(chatId, '❌ Failed to send voice message.');
                if (fs.existsSync(audioPath)) {
                    fs.unlinkSync(audioPath);
                }
            });
        });
        
    } catch (error) {
        console.error('TTS handling error:', error);
        bot.sendMessage(chatId, '❌ Text-to-speech failed.');
    }
}

module.exports = {
    handleTTS
};