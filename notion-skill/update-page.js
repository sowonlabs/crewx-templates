#!/usr/bin/env node

const { notion } = require('./notion-client');

/**
 * Parse markdown-like content into Notion blocks
 * @param {string} content - Content with markdown headings and paragraphs
 * @returns {Array} Array of Notion block objects
 */
function parseContentToBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];

  for (const line of lines) {
    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.substring(2) } }],
        },
      });
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.substring(3) } }],
        },
      });
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.substring(4) } }],
        },
      });
    }
    // Paragraph
    else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }],
        },
      });
    }
  }

  return blocks;
}

/**
 * Delete all blocks from a page
 * @param {string} pageId - The page ID to clear
 */
async function deleteAllBlocks(pageId) {
  try {
    // Get all blocks from the page
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    // Delete each block
    for (const block of response.results) {
      await notion.blocks.delete({
        block_id: block.id,
      });
    }

    console.log(`✅ Deleted ${response.results.length} blocks from page`);
  } catch (error) {
    console.error('❌ Error deleting blocks:', error.message);
    throw error;
  }
}

/**
 * Update a Notion page with new content
 * @param {string} pageId - The page ID to update
 * @param {string} content - New content (supports markdown headings)
 */
async function updatePageContent(pageId, content) {
  try {
    console.log('🔄 Updating page content...');

    // Step 1: Delete all existing blocks
    await deleteAllBlocks(pageId);

    // Step 2: Parse content into blocks
    const blocks = parseContentToBlocks(content);

    // Step 3: Add new blocks to the page
    for (let i = 0; i < blocks.length; i += 100) {
      const chunk = blocks.slice(i, i + 100);
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunk,
      });
      console.log(`✅ Added blocks ${i + 1}-${Math.min(i + 100, blocks.length)}`);
    }

    console.log(`🎉 Successfully updated page with ${blocks.length} new blocks`);
    console.log(`📄 View page: https://www.notion.so/${pageId.replace(/-/g, '')}`);
  } catch (error) {
    console.error('❌ Error updating page:', error.message);
    throw error;
  }
}

// Main execution
(async () => {
  const pageId = process.argv[2];
  const content = process.argv.slice(3).join(' ');

  if (!pageId) {
    console.error('❌ Usage: node update-page.js <page-id> <content>');
    console.error('   Example: node update-page.js 2a989... "# New Title\\n\\nNew content"');
    process.exit(1);
  }

  if (!content) {
    console.error('❌ Content is required');
    process.exit(1);
  }

  await updatePageContent(pageId, content);
})();
