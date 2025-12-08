#!/usr/bin/env node

/**
 * List Google Calendar Events
 *
 * Usage:
 *   node list-events.js [calendar-id] [--days N]
 *
 * Examples:
 *   node list-events.js                    # Primary calendar, next 7 days
 *   node list-events.js primary --days 14  # Primary calendar, next 14 days
 *   node list-events.js your@email.com     # Specific calendar
 */

const { getCalendarClient, formatDateTime, formatDate } = require('./calendar-client');

async function main() {
  const args = process.argv.slice(2);
  let calendarId = 'primary';
  let days = 7;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      i++;
    } else if (!args[i].startsWith('--')) {
      calendarId = args[i];
    }
  }

  // Calculate time range
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(now.getDate() - 1); // Include yesterday
  const timeMax = new Date(now);
  timeMax.setDate(now.getDate() + days);

  console.log(`Fetching events from "${calendarId}"...`);
  console.log(`Period: ${formatDate(timeMin)} ~ ${formatDate(timeMax)}`);
  console.log('');

  try {
    const calendar = getCalendarClient();
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    if (events.length === 0) {
      console.log('No events found for this period.');
      return;
    }

    console.log(`Found ${events.length} events:`);
    console.log('');
    console.log('-'.repeat(80));

    events.forEach((event) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const startDate = new Date(start);
      const endDate = new Date(end);
      const isAllDay = !event.start?.dateTime;

      console.log(`${event.summary || 'No title'}`);

      if (isAllDay) {
        console.log(`   All day: ${formatDate(startDate)}`);
      } else {
        console.log(`   Time: ${formatDateTime(startDate)} - ${formatDateTime(endDate)}`);
      }

      if (event.location) {
        console.log(`   Location: ${event.location}`);
      }

      if (event.description) {
        const desc = event.description.substring(0, 100);
        console.log(`   Description: ${desc}${event.description.length > 100 ? '...' : ''}`);
      }

      if (event.attendees && event.attendees.length > 0) {
        const attendeeList = event.attendees.slice(0, 3).map(a => a.email).join(', ');
        const more = event.attendees.length > 3 ? ` (+${event.attendees.length - 3} more)` : '';
        console.log(`   Attendees: ${attendeeList}${more}`);
      }

      console.log(`   ID: ${event.id}`);
      console.log('');
    });

    console.log('-'.repeat(80));

  } catch (error) {
    console.error('Error fetching events:', error.message);
    process.exit(1);
  }
}

main();
