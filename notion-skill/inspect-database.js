#!/usr/bin/env node

const { notion } = require('./notion-client');

async function inspectDatabase(databaseId) {
  try {
    console.log('🔍 Inspecting database...\n');

    const database = await notion.databases.retrieve({ database_id: databaseId });

    console.log('📊 Database Information:');
    console.log(`   Title: ${database.title?.[0]?.plain_text || 'Untitled'}`);
    console.log(`   ID: ${database.id}`);
    console.log(`   URL: ${database.url}`);
    console.log(`   Created: ${new Date(database.created_time).toLocaleString('ko-KR')}`);
    console.log('\n📋 Raw database object:\n');
    console.log(JSON.stringify(database, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const databaseId = process.argv[2] || '2a6956b8-98db-8040-929e-fa5954bc636c';
inspectDatabase(databaseId);
