#!/usr/bin/env node

/**
 * Create Google Calendar Event
 *
 * Usage:
 *   node create-event.js <summary> <start> <end> [options]
 *
 * Options:
 *   --calendar <id>       Calendar ID (default: primary)
 *   --location <location> Event location
 *   --description <desc>  Event description
 *   --attendees <emails>  Comma-separated attendee emails
 *   --timezone <tz>       Timezone (default: Asia/Seoul)
 *
 * Examples:
 *   node create-event.js "Team Meeting" "2025-12-05T10:00:00" "2025-12-05T11:00:00"
 *   node create-event.js "Lunch" "2025-12-05T12:00:00" "2025-12-05T13:00:00" --location "Restaurant"
 *   node create-event.js "Review" "2025-12-05T14:00:00" "2025-12-05T15:00:00" --attendees "a@example.com,b@example.com"
 */

const { getCalendarClient, formatDateTime } = require('./calendar-client');

function parseArgs(args) {
  const result = {
    summary: null,
    start: null,
    end: null,
    calendarId: 'primary',
    location: null,
    description: null,
    attendees: [],
    timezone: 'Asia/Seoul',
  };

  let positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--calendar' && args[i + 1]) {
      result.calendarId = args[++i];
    } else if (arg === '--location' && args[i + 1]) {
      result.location = args[++i];
    } else if (arg === '--description' && args[i + 1]) {
      result.description = args[++i];
    } else if (arg === '--attendees' && args[i + 1]) {
      result.attendees = args[++i].split(',').map(e => ({ email: e.trim() }));
    } else if (arg === '--timezone' && args[i + 1]) {
      result.timezone = args[++i];
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  if (positional.length >= 3) {
    result.summary = positional[0];
    result.start = positional[1];
    result.end = positional[2];
  }

  return result;
}

function showUsage() {
  console.log('Usage: node create-event.js <summary> <start> <end> [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  summary    Event title');
  console.log('  start      Start time (ISO format: 2025-12-05T10:00:00)');
  console.log('  end        End time (ISO format: 2025-12-05T11:00:00)');
  console.log('');
  console.log('Options:');
  console.log('  --calendar <id>       Calendar ID (default: primary)');
  console.log('  --location <location> Event location');
  console.log('  --description <desc>  Event description');
  console.log('  --attendees <emails>  Comma-separated attendee emails');
  console.log('  --timezone <tz>       Timezone (default: Asia/Seoul)');
  console.log('');
  console.log('Examples:');
  console.log('  node create-event.js "Meeting" "2025-12-05T10:00:00" "2025-12-05T11:00:00"');
  console.log('  node create-event.js "Lunch" "2025-12-05T12:00" "2025-12-05T13:00" --location "Cafe"');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const params = parseArgs(args);

  if (!params.summary || !params.start || !params.end) {
    console.error('Error: summary, start, and end are required');
    console.error('');
    showUsage();
    process.exit(1);
  }

  console.log('Creating event...');
  console.log('');

  try {
    const calendar = getCalendarClient();

    const eventData = {
      summary: params.summary,
      location: params.location,
      description: params.description,
      start: {
        dateTime: params.start,
        timeZone: params.timezone,
      },
      end: {
        dateTime: params.end,
        timeZone: params.timezone,
      },
      attendees: params.attendees.length > 0 ? params.attendees : undefined,
      reminders: { useDefault: true },
    };

    const response = await calendar.events.insert({
      calendarId: params.calendarId,
      requestBody: eventData,
      sendUpdates: params.attendees.length > 0 ? 'all' : 'none',
    });

    const event = response.data;
    const startDate = new Date(event.start?.dateTime || event.start?.date);
    const endDate = new Date(event.end?.dateTime || event.end?.date);

    console.log('Event created successfully!');
    console.log('');
    console.log('-'.repeat(60));
    console.log(`Title: ${event.summary}`);
    console.log(`Time: ${formatDateTime(startDate)} - ${formatDateTime(endDate)}`);

    if (event.location) {
      console.log(`Location: ${event.location}`);
    }

    if (event.description) {
      console.log(`Description: ${event.description}`);
    }

    if (event.attendees && event.attendees.length > 0) {
      console.log(`Attendees: ${event.attendees.map(a => a.email).join(', ')}`);
    }

    console.log(`Event ID: ${event.id}`);

    if (event.htmlLink) {
      console.log(`Link: ${event.htmlLink}`);
    }

    console.log('-'.repeat(60));

  } catch (error) {
    console.error('Error creating event:', error.message);
    process.exit(1);
  }
}

main();
