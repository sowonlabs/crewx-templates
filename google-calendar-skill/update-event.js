#!/usr/bin/env node

/**
 * Update Google Calendar Event
 *
 * Usage:
 *   node update-event.js <event-id> [options]
 *
 * Options:
 *   --calendar <id>       Calendar ID (default: primary)
 *   --summary <title>     New event title
 *   --location <location> New location
 *   --description <desc>  New description
 *   --start <datetime>    New start time (ISO format)
 *   --end <datetime>      New end time (ISO format)
 *   --timezone <tz>       Timezone (default: Asia/Seoul)
 *
 * Examples:
 *   node update-event.js abc123 --summary "Updated Meeting"
 *   node update-event.js abc123 --start "2025-12-05T15:00:00" --end "2025-12-05T16:00:00"
 *   node update-event.js abc123 --location "New Location" --description "Updated desc"
 */

const { getCalendarClient, formatDateTime } = require('./calendar-client');

function parseArgs(args) {
  const result = {
    eventId: null,
    calendarId: 'primary',
    summary: null,
    location: null,
    description: null,
    start: null,
    end: null,
    timezone: 'Asia/Seoul',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--calendar' && args[i + 1]) {
      result.calendarId = args[++i];
    } else if (arg === '--summary' && args[i + 1]) {
      result.summary = args[++i];
    } else if (arg === '--location' && args[i + 1]) {
      result.location = args[++i];
    } else if (arg === '--description' && args[i + 1]) {
      result.description = args[++i];
    } else if (arg === '--start' && args[i + 1]) {
      result.start = args[++i];
    } else if (arg === '--end' && args[i + 1]) {
      result.end = args[++i];
    } else if (arg === '--timezone' && args[i + 1]) {
      result.timezone = args[++i];
    } else if (!arg.startsWith('--')) {
      result.eventId = arg;
    }
  }

  return result;
}

function showUsage() {
  console.log('Usage: node update-event.js <event-id> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --calendar <id>       Calendar ID (default: primary)');
  console.log('  --summary <title>     New event title');
  console.log('  --location <location> New location');
  console.log('  --description <desc>  New description');
  console.log('  --start <datetime>    New start time (ISO format)');
  console.log('  --end <datetime>      New end time (ISO format)');
  console.log('  --timezone <tz>       Timezone (default: Asia/Seoul)');
  console.log('');
  console.log('Examples:');
  console.log('  node update-event.js abc123 --summary "Updated Meeting"');
  console.log('  node update-event.js abc123 --start "2025-12-05T15:00:00" --end "2025-12-05T16:00:00"');
  console.log('');
  console.log('Tip: Get event IDs from: node list-events.js');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const params = parseArgs(args);

  if (!params.eventId) {
    console.error('Error: event-id is required');
    console.error('');
    showUsage();
    process.exit(1);
  }

  // Check if any update options provided
  const hasUpdates = params.summary || params.location || params.description || params.start || params.end;
  if (!hasUpdates) {
    console.error('Error: At least one update option is required');
    console.error('');
    showUsage();
    process.exit(1);
  }

  console.log(`Updating event ${params.eventId}...`);
  console.log('');

  try {
    const calendar = getCalendarClient();

    // First, get the existing event
    const existing = await calendar.events.get({
      calendarId: params.calendarId,
      eventId: params.eventId,
    });

    const event = existing.data;

    // Apply updates
    if (params.summary) event.summary = params.summary;
    if (params.location) event.location = params.location;
    if (params.description) event.description = params.description;

    if (params.start) {
      event.start = {
        dateTime: params.start,
        timeZone: params.timezone,
      };
    }

    if (params.end) {
      event.end = {
        dateTime: params.end,
        timeZone: params.timezone,
      };
    }

    // Update the event
    const response = await calendar.events.update({
      calendarId: params.calendarId,
      eventId: params.eventId,
      requestBody: event,
    });

    const updated = response.data;
    const startDate = new Date(updated.start?.dateTime || updated.start?.date);
    const endDate = new Date(updated.end?.dateTime || updated.end?.date);

    console.log('Event updated successfully!');
    console.log('');
    console.log('-'.repeat(60));
    console.log(`Title: ${updated.summary}`);
    console.log(`Time: ${formatDateTime(startDate)} - ${formatDateTime(endDate)}`);

    if (updated.location) {
      console.log(`Location: ${updated.location}`);
    }

    if (updated.description) {
      console.log(`Description: ${updated.description}`);
    }

    console.log(`Event ID: ${updated.id}`);
    console.log('-'.repeat(60));

  } catch (error) {
    if (error.code === 404) {
      console.error('Error: Event not found');
    } else {
      console.error('Error updating event:', error.message);
    }
    process.exit(1);
  }
}

main();
