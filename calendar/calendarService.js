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
    const monthAgo = new Date();
    monthAgo.setDate(now.getDate() - 30);
    
    // Obtener eventos
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: monthAgo.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 500
    });
    
    const events = response.data.items.map(event => (formatEventData(event)));
    
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
    
    // Set new description
    const description = event.description || '';
    const attributes = JSON.parse(description || '{}');
    attributes.started = true;
    
    //set start time to now
    const now = new Date();
    const eventDuration = event.end ? (new Date(event.end.dateTime || event.end.date) - new Date(event.start.dateTime || event.start.date)) : 15 * 60 * 1000; // Default to 15 mins if no end time
    event.start = { dateTime: now.toISOString() };
    event.end = { dateTime: new Date(now.getTime() + eventDuration).toISOString() }; 

    
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
    
    return formatEventData(updatedEvent.data);
    
  } catch (error) {
    console.error('Error starting event:', error.message);
    throw error;
  }
}

async function finishEvent(eventId) {
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
    
    // Set new description
    const description = event.description || '';
    const attributes = JSON.parse(description || '{}');
    attributes.finished = true;
    
    // Set end time to now
    const now = new Date();
    event.end = { dateTime: now.toISOString() };
    
    const updatedEvent = await calendar.events.patch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId,
      requestBody: {
        ...event,
        description: JSON.stringify(attributes),
        colorId: process.env.GOOGLE_COMPLTETED_COLOR || undefined
      }
    });
    
    // Clear cache to force refresh on next fetch
    clearCache();
    
    return formatEventData(updatedEvent.data);
    
  } catch (error) {
    console.error('Error finishing event:', error.message);
    throw error;
  }
}

async function createEvent(title, expectedDuration) {
  try {
    const auth = await googleClient.getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const eventResponse = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: {
        summary: `${title} (${expectedDuration}mins)`,
        start: {
          dateTime: new Date().toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + expectedDuration * 60 * 1000).toISOString()
        },
        description: JSON.stringify({ finished: false })
      }
    });

  }catch (error) {
    console.error('Error creating event:', error.message);
    throw error;
  }
}

async function deleteEvent(eventId) {
  try {
    const auth = await googleClient.getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId
    });

    // Clear cache to force refresh on next fetch
    clearCache();

  } catch (error) {
    console.error('Error deleting event:', error.message);
    throw error;
  }
}

function clearCache() {
  eventsCache = null;
  cacheTimestamp = null;
  console.log('Cleaned cache');
}

function formatEventData(event) {
  const titleMatch = event.summary ? event.summary.match(/.+(?= ?\(\d+mins?)/gmis) : null;
  const durationMatch = event.summary ? event.summary.match(/\d+(?=mins?)/gmis) : null;

  return {
    id: event.id,
    title: titleMatch ? titleMatch[0].trim() : event.summary || 'No title',
    expectedDuration: durationMatch ? durationMatch[0].trim() : '?',
    date: event.start.dateTime || event.start.date,
    endDate: event.end ? (event.end.dateTime || event.end.date) : null,
    location: event.location || '',
    description: event.description || '',
    endable: (new Date() >= new Date(event.start.dateTime || event.start.date))
  };
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
  getLastMonthEvents,
  clearCache,
  formatDate,
  formatTime,
  startEvent,
  finishEvent,
  createEvent,
  deleteEvent
};
