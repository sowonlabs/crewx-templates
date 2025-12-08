/**
 * Shared Google Calendar client for CrewX skill
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

/**
 * Get authenticated Calendar client
 */
function getCalendarClient() {
  const clientId = process.env.CALENDAR_CLIENT_ID;
  const clientSecret = process.env.CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing credentials. Run setup-auth.js first.');
    console.error('Required: CALENDAR_CLIENT_ID, CALENDAR_CLIENT_SECRET, CALENDAR_REFRESH_TOKEN');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Format date to Korean locale
 */
function formatDateTime(date) {
  try {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Date not specified';
  }
}

/**
 * Format date only (no time)
 */
function formatDate(date) {
  try {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Date not specified';
  }
}

module.exports = { getCalendarClient, formatDateTime, formatDate };
