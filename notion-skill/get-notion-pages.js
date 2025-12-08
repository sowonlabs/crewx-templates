#!/usr/bin/env node

/**
 * Notion Workspace Pages Fetcher
 *
 * This script fetches all pages from your Notion workspace using the Notion API.
 *
 * Setup:
 * 1. Create a Notion Integration at https://www.notion.so/my-integrations
 * 2. Copy the API token and add it to .env as NOTION_INTEGRATION_SECRET
 * 3. Share your Notion pages with the integration
 * 4. Install dependencies: npm install @notionhq/client dotenv
 * 5. Run: node get-notion-pages.js
 */

const { notion, getPageTitle, formatDate } = require('./notion-client');

/**
 * Fetch all pages from Notion workspace
 */
async function getAllPages() {
  try {
    console.log('🔍 Fetching pages from Notion workspace...\n');

    // Search for all pages
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    if (response.results.length === 0) {
      console.log('❌ No pages found. Make sure you have:');
      console.log('  1. Created a Notion Integration at https://www.notion.so/my-integrations');
      console.log('  2. Added NOTION_INTEGRATION_SECRET to .env');
      console.log('  3. Shared your Notion pages with the integration');
      return;
    }

    console.log(`✅ Found ${response.results.length} pages:\n`);
    console.log('─'.repeat(80));

    // Display page information
    response.results.forEach((page, index) => {
      const title = getPageTitle(page);
      const url = page.url;
      const lastEdited = new Date(page.last_edited_time).toLocaleString('ko-KR');
      const id = page.id;

      console.log(`\n📄 Page ${index + 1}:`);
      console.log(`   Title: ${title}`);
      console.log(`   ID: ${id}`);
      console.log(`   URL: ${url}`);
      console.log(`   Last Edited: ${lastEdited}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✨ Total: ${response.results.length} pages`);

    // Return results for further processing
    return response.results;
  } catch (error) {
    console.error('❌ Error fetching pages:', error.message);

    if (error.code === 'unauthorized') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if NOTION_INTEGRATION_SECRET is set correctly in .env');
      console.error('  2. Verify the token at https://www.notion.so/my-integrations');
      console.error('  3. Make sure the integration is not revoked');
    } else if (error.code === 'restricted_resource') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Share your Notion pages with the integration');
      console.error('  2. Go to page settings → Add connections → Select your integration');
    }

    process.exit(1);
  }
}


/**
 * Export pages to JSON file
 */
async function exportToJSON(pages) {
  const fs = require('fs').promises;
  const filename = `notion-pages-${Date.now()}.json`;

  const exportData = pages.map(page => ({
    id: page.id,
    title: getPageTitle(page),
    url: page.url,
    created_time: page.created_time,
    last_edited_time: page.last_edited_time,
  }));

  await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
  console.log(`\n💾 Pages exported to: ${filename}`);
}

// Main execution
if (require.main === module) {
  getAllPages()
    .then(pages => {
      if (pages && pages.length > 0) {
        // Optionally export to JSON
        // return exportToJSON(pages);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { getAllPages, getPageTitle };
