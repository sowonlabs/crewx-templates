#!/usr/bin/env node

/**
 * Gmail List Messages
 *
 * Retrieve and display recent emails from Gmail inbox.
 *
 * Usage:
 *   node list-messages.js [maxResults]
 *   node list-messages.js 20
 */

const { getGmailClient } = require('./gmail-client');

async function listMessages(maxResults = 10) {
  try {
    console.log(`📬 Fetching ${maxResults} most recent emails...\n`);

    const gmail = await getGmailClient();

    // Get message IDs
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
    });

    if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
      console.log('📭 No emails found in inbox.');
      return [];
    }

    console.log(`✅ Found ${listResponse.data.messages.length} emails:\n`);
    console.log('─'.repeat(80));

    // Fetch details for each message
    const messages = [];
    for (const msg of listResponse.data.messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
      const date = headers.find(h => h.name === 'Date')?.value;
      const dateStr = date ? new Date(date).toLocaleString('ko-KR') : 'Unknown';

      const isUnread = detail.data.labelIds?.includes('UNREAD') || false;
      const isImportant = detail.data.labelIds?.includes('IMPORTANT') || false;

      messages.push({
        id: msg.id,
        threadId: detail.data.threadId,
        from,
        subject,
        date: dateStr,
        snippet: detail.data.snippet || '',
        isUnread,
        isImportant,
      });

      // Print message info
      const unreadIcon = isUnread ? '📮 [UNREAD]' : '📭';
      const importantIcon = isImportant ? '⭐' : '';
      console.log(`\n${unreadIcon}${importantIcon} ${subject}`);
      console.log(`   From: ${from}`);
      console.log(`   Date: ${dateStr}`);
      console.log(`   ID: ${msg.id}`);
      if (detail.data.snippet) {
        const snippet = detail.data.snippet.substring(0, 100);
        console.log(`   Preview: ${snippet}...`);
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✨ Total: ${messages.length} emails`);
    console.log('\nTo read a specific email, use:');
    console.log('  node skills/gmail/read-message.js <message-id>');

    return messages;

  } catch (error) {
    console.error('❌ Error listing messages:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const maxResults = parseInt(process.argv[2]) || 10;
listMessages(maxResults);
