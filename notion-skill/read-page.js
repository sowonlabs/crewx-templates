const { notion } = require('./notion-client');

async function readPageContent(pageId) {
  try {
    console.log('📖 Reading page content...\n');

    // Get page metadata
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Get page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    // Print page title
    const title = page.properties.title?.title?.[0]?.plain_text || 'Untitled';
    console.log(`📄 Page: ${title}`);
    console.log(`🔗 URL: ${page.url}`);
    console.log(`📅 Last Edited: ${new Date(page.last_edited_time).toLocaleString('ko-KR')}\n`);
    console.log('─'.repeat(80) + '\n');

    // Print blocks content
    for (const block of blocks.results) {
      printBlock(block);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'object_not_found') {
      console.error('   → Page not found. Make sure the page is shared with the integration.');
    }
  }
}

function printBlock(block, indent = 0) {
  const prefix = '  '.repeat(indent);

  switch (block.type) {
    case 'paragraph':
      const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
      if (text) console.log(prefix + text);
      break;

    case 'heading_1':
      const h1 = block.heading_1.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '\n# ' + h1 + '\n');
      break;

    case 'heading_2':
      const h2 = block.heading_2.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '\n## ' + h2 + '\n');
      break;

    case 'heading_3':
      const h3 = block.heading_3.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '\n### ' + h3 + '\n');
      break;

    case 'bulleted_list_item':
      const bullet = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '• ' + bullet);
      break;

    case 'numbered_list_item':
      const numbered = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + numbered);
      break;

    case 'to_do':
      const checked = block.to_do.checked ? '☑' : '☐';
      const todo = block.to_do.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + checked + ' ' + todo);
      break;

    case 'toggle':
      const toggle = block.toggle.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '▸ ' + toggle);
      break;

    case 'quote':
      const quote = block.quote.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '> ' + quote);
      break;

    case 'callout':
      const callout = block.callout.rich_text.map(t => t.plain_text).join('');
      const icon = block.callout.icon?.emoji || '💡';
      console.log(prefix + icon + ' ' + callout);
      break;

    case 'code':
      const code = block.code.rich_text.map(t => t.plain_text).join('');
      console.log(prefix + '```' + block.code.language);
      console.log(code);
      console.log(prefix + '```');
      break;

    case 'divider':
      console.log(prefix + '─'.repeat(60));
      break;

    default:
      // For other block types, try to extract text if available
      if (block[block.type]?.rich_text) {
        const content = block[block.type].rich_text.map(t => t.plain_text).join('');
        if (content) console.log(prefix + content);
      }
  }
}

// Get page ID from command line argument
const pageId = process.argv[2] || '2a6956b8-98db-805b-b154-c6cabe5eac5a'; // Default to AllWrite PRD
readPageContent(pageId);
