#!/usr/bin/env node

/**
 * List Google Calendars
 *
 * Usage:
 *   node list-calendars.js
 */

const { getCalendarClient } = require('./calendar-client');

async function main() {
  console.log('Fetching calendar list...');
  console.log('');

  try {
    const calendar = getCalendarClient();
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    if (calendars.length === 0) {
      console.log('No calendars found.');
      return;
    }

    console.log(`Found ${calendars.length} calendars:`);
    console.log('');
    console.log('-'.repeat(80));

    calendars.forEach((cal, index) => {
      const primary = cal.primary ? ' (Primary)' : '';
      console.log(`${index + 1}. ${cal.summary || 'Unnamed calendar'}${primary}`);
      console.log(`   ID: ${cal.id}`);
      if (cal.description) {
        console.log(`   Description: ${cal.description}`);
      }
      console.log(`   Time Zone: ${cal.timeZone || 'Not specified'}`);
      console.log(`   Access Role: ${cal.accessRole}`);
      console.log('');
    });

    console.log('-'.repeat(80));
    console.log('');
    console.log('To list events from a calendar:');
    console.log('  node list-events.js [calendar-id]');

  } catch (error) {
    console.error('Error fetching calendars:', error.message);
    process.exit(1);
  }
}

main();
