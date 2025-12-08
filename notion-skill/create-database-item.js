#!/usr/bin/env node

/**
 * Notion Database Item Creator
 *
 * Create a new item/page in a Notion database
 *
 * Usage:
 *   node create-database-item.js [database-id] [title]
 *   node create-database-item.js 2a6956b8-98db-8040 "New Item"
 */

const { notion } = require('./notion-client');

async function createDatabaseItem(databaseId, title) {
  try {
    console.log(`📝 Creating new database item: "${title}"\n`);

    // First, get database schema to understand properties
    const database = await notion.databases.retrieve({ database_id: databaseId });

    console.log(`📊 Database: ${database.title[0]?.plain_text || 'Untitled'}`);
    console.log(`   Properties:`, Object.keys(database.properties).join(', '));
    console.log();

    // Build properties object - try to find the title property
    const properties = {};

    // Find the title property (usually "Name" or "Title")
    const titleProperty = Object.entries(database.properties).find(
      ([_, prop]) => prop.type === 'title'
    );

    if (titleProperty) {
      const [titlePropName] = titleProperty;
      properties[titlePropName] = {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      };
    }

    // Create the database page
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: properties,
    });

    console.log('✅ Database item created successfully!\n');
    console.log('─'.repeat(80));
    console.log(`\n📄 Item Details:`);
    console.log(`   Title: ${title}`);
    console.log(`   ID: ${response.id}`);
    console.log(`   URL: ${response.url}`);
    console.log(`   Created: ${new Date(response.created_time).toLocaleString('ko-KR')}`);
    console.log('\n' + '─'.repeat(80));

    return response;
  } catch (error) {
    console.error('❌ Error creating database item:', error.message);

    if (error.code === 'object_not_found') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if the database ID is correct');
      console.error('  2. Make sure the database is shared with the integration');
    } else if (error.code === 'validation_error') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if the database ID format is correct');
      console.error('  2. Verify the database has a title property');
    }

    process.exit(1);
  }
}

// Get arguments from command line
const databaseId = process.argv[2];
const title = process.argv.slice(3).join(' ');

if (!databaseId || !title) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node create-database-item.js [database-id] [title]');
  console.log('Example: node create-database-item.js 2a6956b8-98db-8040 "New Item"');
  process.exit(1);
}

createDatabaseItem(databaseId, title);
