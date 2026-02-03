const express = require('express');
const router = express.Router();
const googleClient = require('../calendar/googleClient');
const tokenStore = require('../calendar/tokenStore');

// GET /admin
router.get('/', async (req, res) => {
  try {
    const hasTokens = await tokenStore.hasTokens();
    
    res.render('admin', {
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      hasTokens
    });
  } catch (error) {
    console.error('Error in /admin:', error);
    res.status(500).send('Error loading admin panel');
  }
});

// GET /admin/connect
// Starts the OAuth flow
router.get('/connect', (req, res) => {
  const authUrl = googleClient.getAuthUrl();
  res.redirect(authUrl);
});

// GET /admin/oauth2callback
// Google OAuth callback
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  
  try {
    await googleClient.getTokensFromCode(code);
    res.redirect('/admin?success=true');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send('Error completing authorization');
  }
});

// POST /admin/disconnect
// Deletes stored tokens
router.post('/disconnect', async (req, res) => {
  try {
    await tokenStore.deleteTokens();
    res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ success: false, message: 'Error disconnecting' });
  }
});

module.exports = router;
