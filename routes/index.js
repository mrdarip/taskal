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
        eventsGroupedByDate: {},
        sortedDays: [],
        error: 'no_config',
        adminUrl: '/admin'
      });
    }
    
    const events = await calendarService.getLastMonthEvents();
    
    const formattedEvents = events.map(event => {
      const startDate = new Date(event.date);
      const endDate = event.endDate ? new Date(event.endDate) : null;
      const durationMins = endDate ? Math.round((endDate - startDate) / 60000) : 0;

      const attributes = JSON.parse(event.description || '{}');
      
      return {
        id: event.id,
        title: event.title,
        dateKey: startDate.toISOString().split('T')[0],
        displayDate: calendarService.formatDate(event.date),
        time: calendarService.formatTime(event.date),
        duration: event.expectedDuration || durationMins,
        location: event.location,
        description: event.description,
        finished: attributes.finished || false
      };
    }).filter(event => !event.finished); // Filter out finished events

    const eventsGroupedByDate = {};
    formattedEvents.forEach(event => {
      if (!eventsGroupedByDate[event.dateKey]) {
        eventsGroupedByDate[event.dateKey] = {
          displayDate: event.displayDate,
          relDisplayDate: getRelativeLabel(event.dateKey),
          events: []
        };
      }
      eventsGroupedByDate[event.dateKey].events.push(event);
    });
    
    // Sort days in descending order
    const sortedDays = Object.keys(eventsGroupedByDate).sort((a, b) => a.localeCompare(b));
    
    res.render('index', {
      eventsGroupedByDate,
      sortedDays,
      error: null,
      adminUrl: '/admin'
    });
    
  } catch (error) {
    console.error('Error getting events:', error);
    
    // Render with error but don't break the page
    res.render('index', {
      eventsGroupedByDate: {},
      sortedDays: [],
      error: 'calendar_error',
      adminUrl: '/admin'
    });
  }
});

function getRelativeLabel(dateStr) {
  const target = new Date(dateStr);
  target.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
};

module.exports = router;
