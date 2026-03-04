const { storeMemory, getMemory, getAllMemories, deleteMemory } = require('../database/supabase');

async function handleRemember(bot, chatId, userId, category, information) {
    try {
        const result = await storeMemory(userId, category, information);
        
        if (result.success) {
            bot.sendMessage(chatId, `🧠 Remembered in *${category}*: ${information}`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, '❌ Failed to store memory. Please try again.');
        }
    } catch (error) {
        console.error('Remember error:', error);
        bot.sendMessage(chatId, '❌ Error storing memory.');
    }
}

async function handleRecall(bot, chatId, userId, category) {
    try {
        const result = await getMemory(userId, category);
        
        if (result.success && result.data) {
            bot.sendMessage(chatId, `🧠 *${category}*: ${result.data.information}`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, `❌ No memory found for category: ${category}`);
        }
    } catch (error) {
        console.error('Recall error:', error);
        bot.sendMessage(chatId, '❌ Error retrieving memory.');
    }
}

async function handleListMemories(bot, chatId, userId) {
    try {
        const result = await getAllMemories(userId);
        
        if (result.success && result.data.length > 0) {
            let message = '🧠 *Your Memories:*\n\n';
            
            result.data.forEach(memory => {
                message += `*${memory.category}*: ${memory.information}\n\n`;
            });
            
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, '🧠 No memories stored yet. Use /remember <category> <info> to store information.');
        }
    } catch (error) {
        console.error('List memories error:', error);
        bot.sendMessage(chatId, '❌ Error retrieving memories.');
    }
}

async function handleForget(bot, chatId, userId, category) {
    try {
        const result = await deleteMemory(userId, category);
        
        if (result.success) {
            bot.sendMessage(chatId, `🗑️ Forgot everything about: *${category}*`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, `❌ Failed to forget category: ${category}`);
        }
    } catch (error) {
        console.error('Forget error:', error);
        bot.sendMessage(chatId, '❌ Error deleting memory.');
    }
}

module.exports = {
    handleRemember,
    handleRecall,
    handleListMemories,
    handleForget
};