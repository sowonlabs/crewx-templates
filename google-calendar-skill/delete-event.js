#!/usr/bin/env node

/**
 * Delete Google Calendar Event
 *
 * Usage:
 *   node delete-event.js <event-id> [--calendar <id>]
 *
 * Examples:
 *   node delete-event.js 7aibovmeperecvhp18hks103s4
 *   node delete-event.js abc123 --calendar your@email.com
 */

const { getCalendarClient } = require('./calendar-client');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node delete-event.js <event-id> [--calendar <id>]');
    console.log('');
    console.log('Arguments:');
    console.log('  event-id    The ID of the event to delete');
    console.log('');
    console.log('Options:');
    console.log('  --calendar <id>  Calendar ID (default: primary)');
    console.log('');
    console.log('Tip: Get event IDs from: node list-events.js');
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  let eventId = null;
  let calendarId = 'primary';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--calendar' && args[i + 1]) {
      calendarId = args[++i];
    } else if (!args[i].startsWith('--')) {
      eventId = args[i];
    }
  }

  if (!eventId) {
    console.error('Error: event-id is required');
    process.exit(1);
  }

  console.log(`Deleting event ${eventId}...`);

  try {
    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });

    console.log('Event deleted successfully!');

  } catch (error) {
    if (error.code === 404) {
      console.error('Error: Event not found');
    } else {
      console.error('Error deleting event:', error.message);
    }
    process.exit(1);
  }
}

main();
