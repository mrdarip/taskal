const express = require('express');
const router = express.Router();
const calendarService = require('../calendar/calendarService');
const tokenStore = require('../calendar/tokenStore');


// GET /api
router.get('/', async (req, res) => {
  res.json({ message: 'API is working' });
});


// POST /api/start
// recieves eventId as query param, starts the event and returns the updated event data
router.post('/start', async (req, res) => {
  try {
    const hasTokens = await tokenStore.hasTokens();
    
    if (!hasTokens) {
      return res.status(400).json({ error: 'No Google Calendar configuration found' });
    }

    eventId = req.body.eventId;
    if (!eventId) {
        return res.status(400).json({ error: 'Missing eventId in request body' });
    }
    const updatedEvent = await calendarService.startEvent(eventId);
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event: updatedEvent });
} catch (error) {
    console.error('Error in /api/start:', error);
    res.status(500).send('Error loading API data');
  }
});

// POST /api/finish
// recieves eventId as query param, finishes the event and returns the updated event data
router.post('/finish', async (req, res) => {
  try {
    const hasTokens = await tokenStore.hasTokens();
    
    if (!hasTokens) {
      return res.status(400).json({ error: 'No Google Calendar configuration found' });
    }
    
    eventId = req.body.eventId;
    if (!eventId) {
        return res.status(400).json({ error: 'Missing eventId in request body' });
    }
    const updatedEvent = await calendarService.finishEvent(eventId);
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event: updatedEvent });
} catch (error) {
    console.error('Error in /api/finish:', error);
    res.status(500).send('Error loading API data');
  }
});

module.exports = router;
