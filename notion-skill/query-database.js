#!/usr/bin/env node

const { notion, getPageTitle } = require('./notion-client');

async function queryDatabase(databaseId) {
  try {
    console.log('🔍 Querying database items...\n');

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    console.log(`✅ Found ${response.results.length} items:\n`);
    console.log('─'.repeat(80));

    response.results.forEach((page, index) => {
      const title = getPageTitle(page);
      console.log(`\n📄 Item ${index + 1}:`);
      console.log(`   Title: ${title}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Last Edited: ${new Date(page.last_edited_time).toLocaleString('ko-KR')}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✨ Total: ${response.results.length} items`);

    return response.results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}


const databaseId = process.argv[2] || '2a6956b8-98db-8040-929e-fa5954bc636c';
queryDatabase(databaseId);
