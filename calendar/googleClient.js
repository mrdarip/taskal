const { google } = require('googleapis');
const tokenStore = require('./tokenStore');

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent' // Force to show consent screen every time
  });
}

async function getTokensFromCode(code) {
  const oauth2Client = createOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    await tokenStore.saveTokens(tokens);
    return tokens;
  } catch (error) {
    console.error('Error obtaining tokens:', error);
    throw error;
  }
}

async function getAuthenticatedClient() {
  const tokens = await tokenStore.getTokens();
  
  if (!tokens) {
    throw new Error('No tokens available. Run the OAuth flow first.');
  }
  
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);
  
  // Configure token refresh handling
  oauth2Client.on('tokens', async (newTokens) => {
    // Save or update tokens
    await tokenStore.saveTokens({ ...tokens, ...newTokens });
  });
  
  return oauth2Client;
}

module.exports = {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient
};
