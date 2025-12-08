#!/usr/bin/env node

/**
 * Gmail Search Messages
 *
 * Search for emails using Gmail search queries.
 *
 * Usage:
 *   node search-messages.js <query> [maxResults]
 *   node search-messages.js "from:example@gmail.com"
 *   node search-messages.js "is:unread" 20
 *   node search-messages.js "subject:meeting after:2024/01/01"
 *
 * Query examples:
 *   from:user@example.com     - Emails from specific sender
 *   to:user@example.com       - Emails to specific recipient
 *   subject:hello             - Subject contains "hello"
 *   is:unread                 - Unread emails
 *   is:starred                - Starred emails
 *   has:attachment            - Emails with attachments
 *   after:2024/01/01          - Emails after date
 *   before:2024/12/31         - Emails before date
 *   label:important           - Emails with label
 *   in:inbox                  - Emails in inbox
 *   in:sent                   - Sent emails
 */

const { getGmailClient } = require('./gmail-client');

async function searchMessages(query, maxResults = 10) {
  try {
    console.log(`🔍 Searching for: "${query}"\n`);

    const gmail = await getGmailClient();

    // Search for messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults,
    });

    if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
      console.log(`❌ No emails found matching: "${query}"`);
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
        labelIds: detail.data.labelIds || [],
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
    console.log(`\n✨ Total: ${messages.length} emails matching "${query}"`);
    console.log('\nTo read a specific email, use:');
    console.log('  node skills/gmail/read-message.js <message-id>');

    return messages;

  } catch (error) {
    console.error('❌ Error searching messages:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const query = process.argv[2];
const maxResults = parseInt(process.argv[3]) || 10;

if (!query) {
  console.error('❌ Error: Please provide a search query');
  console.log('');
  console.log('Usage: node search-messages.js <query> [maxResults]');
  console.log('');
  console.log('Examples:');
  console.log('  node search-messages.js "from:example@gmail.com"');
  console.log('  node search-messages.js "is:unread" 20');
  console.log('  node search-messages.js "subject:meeting"');
  console.log('  node search-messages.js "has:attachment"');
  console.log('  node search-messages.js "after:2024/01/01 before:2024/12/31"');
  console.log('');
  console.log('Query operators:');
  console.log('  from:     - Sender email');
  console.log('  to:       - Recipient email');
  console.log('  subject:  - Subject contains');
  console.log('  is:       - unread, starred, important');
  console.log('  has:      - attachment');
  console.log('  after:    - Date filter (YYYY/MM/DD)');
  console.log('  before:   - Date filter (YYYY/MM/DD)');
  console.log('  label:    - Gmail label');
  console.log('  in:       - inbox, sent, drafts, trash');
  process.exit(1);
}

searchMessages(query, maxResults);
