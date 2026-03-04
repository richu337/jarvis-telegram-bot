function logMessage(username, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${username}: ${message}`);
}

function isAuthorized(userId) {
    const authorizedId = process.env.AUTHORIZED_USER_ID;
    return userId.toString() === authorizedId;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

module.exports = {
    logMessage,
    isAuthorized,
    formatBytes,
    sanitizeFilename
};