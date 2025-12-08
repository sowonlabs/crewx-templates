#!/usr/bin/env node

const { notion } = require('./notion-client');

async function listDatabaseChildren(databaseId) {
  try {
    console.log('🔍 Listing database children...\n');

    // Try to list blocks as if it's a page
    const blocks = await notion.blocks.children.list({
      block_id: databaseId,
    });

    console.log(`✅ Found ${blocks.results.length} blocks:\n`);
    console.log('─'.repeat(80));

    blocks.results.forEach((block, index) => {
      console.log(`\n📦 Block ${index + 1}:`);
      console.log(`   Type: ${block.type}`);
      console.log(`   ID: ${block.id}`);
      if (block[block.type]?.rich_text) {
        const text = block[block.type].rich_text.map(t => t.plain_text).join('');
        if (text) console.log(`   Text: ${text}`);
      }
    });

    console.log('\n' + '─'.repeat(80));

    return blocks.results;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const databaseId = process.argv[2] || '2a6956b8-98db-8040-929e-fa5954bc636c';
listDatabaseChildren(databaseId);
