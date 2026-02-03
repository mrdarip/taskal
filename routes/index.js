const express = require('express');
const router = express.Router();
const calendarService = require('../calendar/calendarService');
const tokenStore = require('../calendar/tokenStore');

// GET
// Legacy compatible HTML
router.get('/', async (req, res) => {
  try {
    const hasTokens = await tokenStore.hasTokens();
    
    if (!hasTokens) {
      return res.render('index', {
        events: [],
        error: 'no_config',
        adminUrl: '/admin'
      });
    }
    
    const events = await calendarService.getLast7DaysEvents();
    
    const formattedEvents = events.map(event => ({
      title: event.title,
      date: calendarService.formatDate(event.date),
      time: calendarService.formatTime(event.date),
      location: event.location,
      description: event.description
    }));
    
    res.render('index', {
      events: formattedEvents,
      error: null,
      adminUrl: '/admin'
    });
    
  } catch (error) {
    console.error('Error getting events:', error);
    
    // Render with error but don't break the page
    res.render('index', {
      events: [],
      error: 'calendar_error',
      adminUrl: '/admin'
    });
  }
});

module.exports = router;
