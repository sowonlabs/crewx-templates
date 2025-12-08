#!/usr/bin/env node

/**
 * Notion Pages Search
 *
 * Search for pages in Notion workspace by keyword
 *
 * Usage:
 *   node search-pages.js [query]
 *   node search-pages.js "PRD"
 */

const { notion, getPageTitle, formatDate } = require('./notion-client');

async function searchPages(query) {
  try {
    console.log(`🔍 Searching for: "${query}"\n`);

    const response = await notion.search({
      query: query,
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
      console.log('❌ No pages found matching your query.');
      return;
    }

    console.log(`✅ Found ${response.results.length} pages:\n`);
    console.log('─'.repeat(80));

    response.results.forEach((page, index) => {
      const title = getPageTitle(page);
      const url = page.url;
      const lastEdited = new Date(page.last_edited_time).toLocaleString('ko-KR');
      const id = page.id;

      console.log(`\n📄 Result ${index + 1}:`);
      console.log(`   Title: ${title}`);
      console.log(`   ID: ${id}`);
      console.log(`   URL: ${url}`);
      console.log(`   Last Edited: ${lastEdited}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✨ Total: ${response.results.length} pages`);

    return response.results;
  } catch (error) {
    console.error('❌ Error searching pages:', error.message);
    process.exit(1);
  }
}


// Get query from command line
const query = process.argv.slice(2).join(' ') || '';

if (!query) {
  console.error('❌ Error: Please provide a search query');
  console.log('\nUsage: node search-pages.js [query]');
  console.log('Example: node search-pages.js "PRD"');
  process.exit(1);
}

searchPages(query);
