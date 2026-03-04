const screenshot = require('screenshot-desktop');
const fs = require('fs');
const path = require('path');

async function handleScreenshot(bot, chatId) {
    try {
        bot.sendChatAction(chatId, 'upload_photo');
        
        const screenshotPath = path.join(__dirname, '../../temp', `screenshot_${Date.now()}.png`);
        
        if (!fs.existsSync(path.dirname(screenshotPath))) {
            fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        }
        
        await screenshot({ filename: screenshotPath });
        
        await bot.sendPhoto(chatId, screenshotPath, {
            caption: `📸 Screenshot taken at ${new Date().toLocaleString()}`
        });
        
        fs.unlinkSync(screenshotPath);
        
    } catch (error) {
        console.error('Screenshot error:', error);
        bot.sendMessage(chatId, '❌ Failed to take screenshot.');
    }
}

async function handleStartMonitoring(bot, chatId, intervalStr, currentInterval) {
    try {
        if (currentInterval) {
            clearInterval(currentInterval);
        }
        
        const interval = parseInterval(intervalStr);
        if (!interval) {
            bot.sendMessage(chatId, '❌ Invalid interval. Use format like: 30s, 2m, 1h');
            return null;
        }
        
        bot.sendMessage(chatId, `📹 Started monitoring every ${intervalStr}`);
        
        const monitoringInterval = setInterval(async () => {
            try {
                await handleScreenshot(bot, chatId);
            } catch (error) {
                console.error('Monitoring screenshot error:', error);
            }
        }, interval);
        
        return monitoringInterval;
        
    } catch (error) {
        console.error('Start monitoring error:', error);
        bot.sendMessage(chatId, '❌ Failed to start monitoring.');
        return null;
    }
}

async function handleStopMonitoring(bot, chatId, currentInterval) {
    try {
        if (currentInterval) {
            clearInterval(currentInterval);
            bot.sendMessage(chatId, '⏹️ Monitoring stopped');
            return null;
        } else {
            bot.sendMessage(chatId, '❌ No monitoring session active');
            return null;
        }
    } catch (error) {
        console.error('Stop monitoring error:', error);
        bot.sendMessage(chatId, '❌ Failed to stop monitoring.');
        return currentInterval;
    }
}

function parseInterval(intervalStr) {
    if (!intervalStr) return 60000; // Default 1 minute
    
    const match = intervalStr.match(/^(\d+)([smh])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        default: return null;
    }
}

module.exports = {
    handleScreenshot,
    handleStartMonitoring,
    handleStopMonitoring
};