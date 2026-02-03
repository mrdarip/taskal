const fs = require('fs').promises;
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '..', 'tokens.json');

async function saveTokens(tokens) {
  try {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('Tokens saved successfully');
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

async function getTokens() {
  try {
    const data = await fs.readFile(TOKEN_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File does not exist, no tokens available
      return null;
    }
    throw error;
  }
}

async function hasTokens() {
  try {
    await fs.access(TOKEN_FILE);
    return true;
  } catch {
    return false;
  }
}

async function deleteTokens() {
  try {
    await fs.unlink(TOKEN_FILE);
    console.log('Tokens deleted successfully');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  saveTokens,
  getTokens,
  hasTokens,
  deleteTokens
};
