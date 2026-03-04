require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const aiCommands = require('./commands/ai');
const memoryCommands = require('./commands/memory');
const systemCommands = require('./commands/system');
const screenshotCommands = require('./commands/screenshot');
const ttsCommands = require('./commands/tts');
const { initializeDatabase } = require('./database/supabase');
const { logMessage, isAuthorized } = require('./utils/helpers');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let monitoringInterval = null;

async function initializeBot() {
    try {
        await initializeDatabase();
        console.log('🤖 Jarvis Bot initialized successfully!');
        
        const botInfo = await bot.getMe();
        console.log(`Bot username: @${botInfo.username}`);
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        process.exit(1);
    }
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAuthorized(msg.from.id)) {
        return bot.sendMessage(chatId, '❌ Unauthorized access denied.');
    }

    const welcomeMessage = `
🤖 *Jarvis AI Assistant* - Ready to serve!

*Available Commands:*

🧠 *AI & Search*
* Send any message for AI conversation
* /search <query> - Search and summarize

🧾 *Memory System*
* /remember <category> <info> - Store information
* /recall <category> - Retrieve stored info
* /memory - View all categories
* /forget <category> - Delete category

💻 *System Control*
* /cmd <command> - Execute system command
* /open <app> - Open application
* /run <script> - Run script file

📸 *Screenshots*
* /screenshot - Take single screenshot
* /monitor start <interval> - Start monitoring (e.g., 30s, 5m)
* /monitor stop - Stop monitoring

🔊 *Text-to-Speech*
* /speak <text> - Convert text to speech
* /tts <text> - Same as speak

Type any message to start chatting with AI!
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    bot.sendMessage(chatId, `
🤖 *Jarvis Commands Help*

*Memory Categories:*
* personal - Personal information
* tasks - Tasks and reminders  
* preferences - User preferences
* general - General information

*System Commands Examples:*
* /cmd dir - List directory
* /cmd ipconfig - Network info
* /open notepad - Open Notepad
* /run script.bat - Run batch file

*Monitoring Examples:*
* /monitor start 30s - Every 30 seconds
* /monitor start 2m - Every 2 minutes
* /monitor start 1h - Every hour

*AI Features:*
* Natural conversation
* Web search and summarization
* Question answering
* Information analysis
    `, { parse_mode: 'Markdown' });
});

bot.onText(/\/search (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const query = match[1];
    await aiCommands.handleSearch(bot, chatId, query);
});

bot.onText(/\/remember (\w+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const category = match[1];
    const info = match[2];
    await memoryCommands.handleRemember(bot, chatId, msg.from.id, category, info);
});

bot.onText(/\/recall (\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const category = match[1];
    await memoryCommands.handleRecall(bot, chatId, msg.from.id, category);
});

bot.onText(/\/memory/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    await memoryCommands.handleListMemories(bot, chatId, msg.from.id);
});

bot.onText(/\/forget (\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const category = match[1];
    await memoryCommands.handleForget(bot, chatId, msg.from.id, category);
});

bot.onText(/\/cmd (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const command = match[1];
    await systemCommands.handleCommand(bot, chatId, command);
});

bot.onText(/\/open (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const app = match[1];
    await systemCommands.handleOpenApp(bot, chatId, app);
});

bot.onText(/\/run (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const script = match[1];
    await systemCommands.handleRunScript(bot, chatId, script);
});

bot.onText(/\/screenshot/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    await screenshotCommands.handleScreenshot(bot, chatId);
});

bot.onText(/\/monitor (start|stop)( .+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const action = match[1];
    const interval = match[2] ? match[2].trim() : null;
    
    if (action === 'start') {
        monitoringInterval = await screenshotCommands.handleStartMonitoring(bot, chatId, interval, monitoringInterval);
    } else {
        monitoringInterval = await screenshotCommands.handleStopMonitoring(bot, chatId, monitoringInterval);
    }
});

bot.onText(/\/(speak|tts) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAuthorized(msg.from.id)) return;
    
    const text = match[2];
    await ttsCommands.handleTTS(bot, chatId, text);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!isAuthorized(msg.from.id)) return;
    
    if (!text || text.startsWith('/')) return;
    
    logMessage(msg.from.username || msg.from.first_name, text);
    await aiCommands.handleConversation(bot, chatId, text, msg.from.id);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Jarvis...');
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    process.exit(0);
});

initializeBot();