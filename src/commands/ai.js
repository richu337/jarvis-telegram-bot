const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getMemory } = require('../database/supabase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const JARVIS_SYSTEM_PROMPT = `You are Jarvis, an AI assistant created to help users with various tasks. You are intelligent, helpful, and have a friendly personality. You can:

- Have natural conversations
- Help with questions and research
- Assist with technical problems
- Remember information about the user
- Control computer systems
- Take screenshots and monitor systems
- Convert text to speech

Always respond as Jarvis, not as a generic AI model. Be helpful, concise, and maintain a professional yet friendly tone. Your name is Jarvis.`;

async function handleConversation(bot, chatId, message, userId) {
    try {
        bot.sendChatAction(chatId, 'typing');
        
        const memories = await getRelevantMemories(userId);
        const context = memories ? `User context: ${memories}\n\n` : '';
        
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });
        
        // Create the full prompt with system instructions
        const fullPrompt = `${JARVIS_SYSTEM_PROMPT}

${context}User message: ${message}

Respond as Jarvis:`;
        
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();
        
        if (response.length > 4096) {
            const chunks = response.match(/.{1,4096}/g);
            for (const chunk of chunks) {
                await bot.sendMessage(chatId, chunk);
            }
        } else {
            bot.sendMessage(chatId, response);
        }
        
    } catch (error) {
        console.error('AI conversation error:', error);
        bot.sendMessage(chatId, '❌ Sorry, I encountered an error processing your message.');
    }
}

async function handleSearch(bot, chatId, query) {
    try {
        bot.sendChatAction(chatId, 'typing');
        
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });
        const prompt = `${JARVIS_SYSTEM_PROMPT}

Search and provide a comprehensive summary about: ${query}. Include key facts, recent information, and relevant details. Respond as Jarvis with helpful information.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        bot.sendMessage(chatId, `🔍 *Search Results for: ${query}*\n\n${response}`, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.error('Search error:', error);
        bot.sendMessage(chatId, '❌ Search failed. Please try again.');
    }
}

async function getRelevantMemories(userId) {
    try {
        const { success, data } = await getMemory(userId, 'personal');
        if (success && data) {
            return data.information;
        }
        return null;
    } catch (error) {
        console.error('Error getting memories:', error);
        return null;
    }
}

module.exports = {
    handleConversation,
    handleSearch
};