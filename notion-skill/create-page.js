#!/usr/bin/env node

/**
 * Notion Page Creator
 *
 * Create a new page in Notion workspace
 *
 * Usage:
 *   node create-page.js [parent-page-id] [title]
 *   node create-page.js 2a6956b8-98db-801f "New Document"
 */

const { notion } = require('./notion-client');

async function createPage(parentPageId, title) {
  try {
    console.log(`📝 Creating new page: "${title}"\n`);

    // Try database first, fallback to page
    let parent;
    try {
      await notion.databases.retrieve({ database_id: parentPageId });
      parent = { database_id: parentPageId };
    } catch {
      parent = { page_id: parentPageId };
    }

    const response = await notion.pages.create({
      parent: parent,
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `Created by AllWrite CrewX on ${new Date().toLocaleString('ko-KR')}`,
                },
              },
            ],
          },
        },
      ],
    });

    console.log('✅ Page created successfully!\n');
    console.log('─'.repeat(80));
    console.log(`\n📄 Page Details:`);
    console.log(`   Title: ${title}`);
    console.log(`   ID: ${response.id}`);
    console.log(`   URL: ${response.url}`);
    console.log(`   Created: ${new Date(response.created_time).toLocaleString('ko-KR')}`);
    console.log('\n' + '─'.repeat(80));

    return response;
  } catch (error) {
    console.error('❌ Error creating page:', error.message);

    if (error.code === 'object_not_found') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if the parent page ID is correct');
      console.error('  2. Make sure the parent page is shared with the integration');
    } else if (error.code === 'validation_error') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if the page title is valid');
      console.error('  2. Make sure the parent page ID format is correct');
    }

    process.exit(1);
  }
}

// Get arguments from command line
const parentPageId = process.argv[2];
const title = process.argv.slice(3).join(' ');

if (!parentPageId || !title) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node create-page.js [parent-page-id] [title]');
  console.log('Example: node create-page.js 2a6956b8-98db-801f "New Document"');
  process.exit(1);
}

createPage(parentPageId, title);
