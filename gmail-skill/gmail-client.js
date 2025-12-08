#!/usr/bin/env node

/**
 * Gmail API Client Helper
 *
 * Shared module for Gmail API authentication and client creation.
 * Loads credentials from skill-local .env file.
 */

const path = require('path');
const { google } = require('googleapis');

// Load environment variables from skill directory first, then fallback to project root
const skillEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '../../.env');

require('dotenv').config({ path: skillEnvPath });
require('dotenv').config({ path: rootEnvPath });

/**
 * Create authenticated Gmail client using refresh token
 * @returns {Promise<gmail_v1.Gmail>}
 */
async function getGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing Gmail credentials!');
    console.error('');
    console.error('Please set the following environment variables in skills/gmail/.env:');
    console.error('  GMAIL_CLIENT_ID=your_client_id');
    console.error('  GMAIL_CLIENT_SECRET=your_client_secret');
    console.error('  GMAIL_REFRESH_TOKEN=your_refresh_token');
    console.error('');
    console.error('Run setup-auth.js to configure authentication:');
    console.error('  node skills/gmail/setup-auth.js --credentials /path/to/credentials.json');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Format bytes to human readable string
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Encode subject for UTF-8 support
 * @param {string} subject
 * @returns {string}
 */
function encodeSubject(subject) {
  return `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
}

module.exports = {
  getGmailClient,
  formatBytes,
  encodeSubject
};
