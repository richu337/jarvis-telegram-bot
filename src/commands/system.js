const { exec } = require('child_process');
const path = require('path');

async function handleCommand(bot, chatId, command) {
    try {
        bot.sendMessage(chatId, `⚡ Executing: \`${command}\``, { parse_mode: 'Markdown' });
        
        exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                return;
            }
            
            if (stderr) {
                bot.sendMessage(chatId, `⚠️ Warning: ${stderr}`);
            }
            
            const output = stdout || 'Command executed successfully (no output)';
            
            if (output.length > 4096) {
                const chunks = output.match(/.{1,4096}/g);
                chunks.forEach((chunk, index) => {
                    bot.sendMessage(chatId, `📄 Output (${index + 1}/${chunks.length}):\n\`\`\`\n${chunk}\n\`\`\``, { parse_mode: 'Markdown' });
                });
            } else {
                bot.sendMessage(chatId, `📄 Output:\n\`\`\`\n${output}\n\`\`\``, { parse_mode: 'Markdown' });
            }
        });
        
    } catch (error) {
        console.error('Command execution error:', error);
        bot.sendMessage(chatId, '❌ Failed to execute command.');
    }
}

async function handleOpenApp(bot, chatId, appName) {
    try {
        const command = `start ${appName}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, `❌ Failed to open ${appName}: ${error.message}`);
                return;
            }
            
            bot.sendMessage(chatId, `✅ Opened: ${appName}`);
        });
        
    } catch (error) {
        console.error('Open app error:', error);
        bot.sendMessage(chatId, '❌ Failed to open application.');
    }
}

async function handleRunScript(bot, chatId, scriptPath) {
    try {
        const fullPath = path.resolve(scriptPath);
        
        exec(fullPath, { timeout: 60000 }, (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, `❌ Script error: ${error.message}`);
                return;
            }
            
            if (stderr) {
                bot.sendMessage(chatId, `⚠️ Script warning: ${stderr}`);
            }
            
            const output = stdout || 'Script executed successfully';
            bot.sendMessage(chatId, `📜 Script output:\n\`\`\`\n${output}\n\`\`\``, { parse_mode: 'Markdown' });
        });
        
    } catch (error) {
        console.error('Run script error:', error);
        bot.sendMessage(chatId, '❌ Failed to run script.');
    }
}

module.exports = {
    handleCommand,
    handleOpenApp,
    handleRunScript
};