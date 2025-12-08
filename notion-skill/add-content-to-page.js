#!/usr/bin/env node

/**
 * Notion Content Appender
 *
 * Add markdown content to existing Notion page
 *
 * Usage:
 *   node add-content-to-page.js [page-id] [file-path]
 */

const { notion } = require('./notion-client');
const fs = require('fs');

async function addContentToPage(pageId, filePath) {
  try {
    console.log(`📝 Adding content from: ${filePath}\n`);

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const blocks = [];

    for (let line of lines) {
      if (!line.trim()) continue;

      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
          }
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
          }
        });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      } else if (line.startsWith('|') || line.includes('---')) {
        // Skip tables and dividers
        continue;
      } else {
        const cleanContent = line.replace(/^\> /, '').replace(/\*\*/g, '').replace(/`/g, '');
        if (cleanContent.trim().length > 0 && cleanContent.trim().length <= 2000) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: cleanContent } }]
            }
          });
        }
      }
    }

    // Split into chunks of 100 blocks (Notion API limit)
    for (let i = 0; i < blocks.length; i += 100) {
      const chunk = blocks.slice(i, i + 100);
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunk
      });
      console.log(`✓ Added blocks ${i + 1} to ${Math.min(i + 100, blocks.length)}`);
    }

    console.log('\n✅ Content added successfully!');
    console.log(`📄 Total blocks added: ${blocks.length}\n`);
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Error adding content:', error.message);
    process.exit(1);
  }
}

const pageId = process.argv[2];
const filePath = process.argv[3];

if (!pageId || !filePath) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node add-content-to-page.js [page-id] [file-path]');
  console.log('Example: node add-content-to-page.js 2a7956b8-98db-8140 ./report.md');
  process.exit(1);
}

addContentToPage(pageId, filePath);
