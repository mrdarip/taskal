const { google } = require('googleapis');
const googleClient = require('./googleClient');

let eventsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 1000;

async function getLast7DaysEvents() {
  if (eventsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('request hit cache!');
    return eventsCache;
  }
  
  try {
    const auth = await googleClient.getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Calcular fechas
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    // Obtener eventos
    const response = await calendar.events.list({
      calendarId: 'default',
      timeMin: sevenDaysAgo.toISOString(),
      timeMax: now.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    });
    
    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary || 'No title',
      date: event.start.dateTime || event.start.date,
      location: event.location || '',
      description: event.description || ''
    }));
    
    // Actualizar cache
    eventsCache = events;
    cacheTimestamp = Date.now();
    
    console.log(`Obtained ${events.length} events from Google Calendar`);
    return events;
    
  } catch (error) {
    console.error('Error obtaining events:', error.message);
    
    if (eventsCache) {
      console.log('Using cache as fallback');
      return eventsCache;
    }
    
    throw error;
  }
}

function clearCache() {
  eventsCache = null;
  cacheTimestamp = null;
  console.log('Cleaned cache');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(dateString) {
  // If only date (no time), do not show time
  if (dateString.length === 10) {
    return null;
  }
  
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

module.exports = {
  getLast7DaysEvents,
  clearCache,
  formatDate,
  formatTime
};
