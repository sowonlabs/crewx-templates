#!/usr/bin/env node

/**
 * Gmail Read Message
 *
 * Retrieve and display the full content of a specific email.
 *
 * Usage:
 *   node read-message.js <message-id>
 *   node read-message.js 18d5a7b8c9d0e1f2
 */

const { getGmailClient, formatBytes } = require('./gmail-client');

async function readMessage(messageId) {
  try {
    console.log(`📖 Reading message: ${messageId}\n`);

    const gmail = await getGmailClient();

    // Get full message content
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    if (!message) {
      console.error('❌ Message not found');
      process.exit(1);
    }

    // Extract headers
    const headers = message.payload?.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const to = headers.find(h => h.name === 'To')?.value || 'Unknown';
    const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
    const date = headers.find(h => h.name === 'Date')?.value;
    const dateStr = date ? new Date(date).toLocaleString('ko-KR') : 'Unknown';
    const cc = headers.find(h => h.name === 'Cc')?.value;

    // Print message header
    console.log('═'.repeat(80));
    console.log(`📧 Subject: ${subject}`);
    console.log('─'.repeat(80));
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    if (cc) console.log(`CC: ${cc}`);
    console.log(`Date: ${dateStr}`);
    console.log(`Message ID: ${messageId}`);
    console.log(`Thread ID: ${message.threadId}`);
    console.log('═'.repeat(80));
    console.log('');

    // Extract body content
    let body = '';

    if (message.payload?.body?.data) {
      // Simple message with body data
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      // Multipart message
      body = extractBodyFromParts(message.payload.parts);
    }

    if (body) {
      console.log('📝 Content:');
      console.log('─'.repeat(80));
      console.log(body);
    } else {
      console.log('(Unable to extract message body)');
    }

    // Extract attachments
    const attachments = extractAttachments(message.payload?.parts || []);
    if (attachments.length > 0) {
      console.log('');
      console.log('─'.repeat(80));
      console.log('📎 Attachments:');
      attachments.forEach((att, idx) => {
        console.log(`   ${idx + 1}. ${att.filename} (${att.mimeType}, ${formatBytes(att.size)})`);
      });
    }

    console.log('');
    console.log('═'.repeat(80));

    // Mark as read if unread
    if (message.labelIds?.includes('UNREAD')) {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      console.log('✅ Message marked as read');
    }

    return {
      id: message.id,
      threadId: message.threadId,
      from,
      to,
      cc,
      subject,
      date: dateStr,
      body,
      attachments,
    };

  } catch (error) {
    if (error.code === 404) {
      console.error('❌ Message not found. Make sure the message ID is correct.');
    } else {
      console.error('❌ Error reading message:', error.message);
    }
    process.exit(1);
  }
}

function extractBodyFromParts(parts) {
  let body = '';

  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      break;
    } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
      // Strip HTML tags for plain text display
      const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      body = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    } else if (part.parts) {
      // Nested parts
      const nestedBody = extractBodyFromParts(part.parts);
      if (nestedBody) body = nestedBody;
    }
  }

  return body;
}

function extractAttachments(parts) {
  const attachments = [];

  for (const part of parts) {
    if (part.filename && part.body) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || 'unknown',
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }
    if (part.parts) {
      attachments.push(...extractAttachments(part.parts));
    }
  }

  return attachments;
}

// Get message ID from command line
const messageId = process.argv[2];

if (!messageId) {
  console.error('❌ Error: Please provide a message ID');
  console.log('');
  console.log('Usage: node read-message.js <message-id>');
  console.log('');
  console.log('To get message IDs, run:');
  console.log('  node skills/gmail/list-messages.js');
  process.exit(1);
}

readMessage(messageId);
