/**
 * Notion Client Module
 *
 * Shared Notion API client for all notion skill scripts.
 * Loads credentials from local .env file.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('@notionhq/client');

// Validate credentials
if (!process.env.NOTION_INTEGRATION_SECRET) {
  console.error('❌ Error: NOTION_INTEGRATION_SECRET not found in .env');
  console.error('');
  console.error('Setup instructions:');
  console.error('1. Copy .env.example to .env');
  console.error('2. Create integration at https://www.notion.so/my-integrations');
  console.error('3. Add your secret to .env file');
  process.exit(1);
}

// Create and export Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET,
});

/**
 * Get page title from page object
 * @param {Object} page - Notion page object
 * @returns {string} - Page title or 'Untitled'
 */
function getPageTitle(page) {
  try {
    if (page.properties) {
      const titleProp = Object.values(page.properties).find(
        prop => prop.type === 'title'
      );

      if (titleProp && titleProp.title && titleProp.title.length > 0) {
        return titleProp.title.map(t => t.plain_text).join('');
      }
    }
    return 'Untitled';
  } catch (error) {
    return 'Untitled';
  }
}

/**
 * Format date to Korean locale string
 * @param {string} dateStr - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleString('ko-KR');
}

module.exports = {
  notion,
  getPageTitle,
  formatDate,
};
