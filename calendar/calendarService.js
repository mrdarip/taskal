const { google } = require('googleapis');
const googleClient = require('./googleClient');

let eventsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 1000;

async function getLastMonthEvents() {
  if (eventsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('request hit cache!');
    return eventsCache;
  }
  
  try {
    const auth = await googleClient.getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Calcular fechas
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 2);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(now.getDate() - 10);
    
    // Obtener eventos
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: tenDaysAgo.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 200
    });
    
    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary.match(/.+(?= ?\(\d+mins?)/gmis)[0].trim() || 'No title',
      expectedDuration: event.summary.match(/\d+(?=mins?)/gmis)[0].trim(),
      date: event.start.dateTime || event.start.date,
      endDate: event.end ? (event.end.dateTime || event.end.date) : null,
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

async function startEvent(eventId) {
  try {
    const auth = await googleClient.getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    
    const eventResponse = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId
    });
    
    const event = eventResponse.data;
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Marcar como iniciado (agregar atributo "started" a la descripción)
    const description = event.description || '';
    const attributes = JSON.parse(description || '{}');
    attributes.started = true;
    
    //set start time to now
    const now = new Date();
    event.start = { dateTime: now.toISOString() };
    const updatedEvent = await calendar.events.patch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId,
      requestBody: {
        ...event,
        description: JSON.stringify(attributes)
      }
    });
    
    // Clear cache to force refresh on next fetch
    clearCache();
    
    return {
      id: updatedEvent.data.id,
      title: updatedEvent.data.summary.match(/.+(?= ?\(\d+mins?)/gmis)[0].trim() || 'No title',
      expectedDuration: updatedEvent.data.summary.match(/\d+(?=mins?)/gmis)[0].trim(),
      date: updatedEvent.data.start.dateTime || updatedEvent.data.start.date,
      endDate: updatedEvent.data.end ? (updatedEvent.data.end.dateTime || updatedEvent.data.end.date) : null,
      location: updatedEvent.data.location || '',
      description: updatedEvent.data.description || ''
    };
    
  } catch (error) {
    console.error('Error starting event:', error.message);
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
  getLast7DaysEvents: getLastMonthEvents,
  clearCache,
  formatDate,
  formatTime,
  startEvent
};
