#!/usr/bin/env node

/**
 * Gmail Send Message
 *
 * Compose and send a new email through Gmail.
 *
 * Usage:
 *   node send-message.js <to> <subject> <body> [cc] [bcc]
 *   node send-message.js "recipient@example.com" "Hello" "Message body here"
 *   node send-message.js "recipient@example.com" "Hello" "Message body" "cc@example.com"
 *
 * Interactive mode (stdin):
 *   echo '{"to":"a@b.com","subject":"Hi","body":"Hello"}' | node send-message.js --json
 */

const { getGmailClient, encodeSubject } = require('./gmail-client');

async function sendMessage(to, subject, body, cc, bcc) {
  try {
    console.log('📤 Sending email...\n');

    const gmail = await getGmailClient();

    // Encode subject for UTF-8 support (Korean, etc.)
    const encodedSubject = encodeSubject(subject);

    // Build email headers
    const emailLines = [
      'From: me',
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'Content-Type: text/html; charset=UTF-8',
    ];

    if (cc) {
      emailLines.push(`Cc: ${cc}`);
    }

    if (bcc) {
      emailLines.push(`Bcc: ${bcc}`);
    }

    // Add empty line and body
    emailLines.push('', body);

    // Create raw email
    const email = emailLines.join('\r\n');

    // Base64 URL-safe encode
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('═'.repeat(60));
    console.log(`📧 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    if (cc) console.log(`📋 CC: ${cc}`);
    if (bcc) console.log(`🔒 BCC: ${bcc}`);
    console.log(`🆔 Message ID: ${response.data.id}`);
    console.log(`🧵 Thread ID: ${response.data.threadId}`);
    console.log('═'.repeat(60));

    return {
      id: response.data.id,
      threadId: response.data.threadId,
      to,
      subject,
      body,
      cc,
      bcc,
    };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
async function main() {
  const args = process.argv.slice(2);

  // JSON mode from stdin
  if (args[0] === '--json') {
    let input = '';
    process.stdin.setEncoding('utf8');

    for await (const chunk of process.stdin) {
      input += chunk;
    }

    try {
      const data = JSON.parse(input);
      if (!data.to || !data.subject || !data.body) {
        console.error('❌ JSON must contain: to, subject, body');
        process.exit(1);
      }
      await sendMessage(data.to, data.subject, data.body, data.cc, data.bcc);
    } catch (e) {
      console.error('❌ Invalid JSON input:', e.message);
      process.exit(1);
    }
    return;
  }

  // Command line arguments
  const [to, subject, body, cc, bcc] = args;

  if (!to || !subject || !body) {
    console.error('❌ Error: Missing required arguments');
    console.log('');
    console.log('Usage: node send-message.js <to> <subject> <body> [cc] [bcc]');
    console.log('');
    console.log('Examples:');
    console.log('  node send-message.js "user@example.com" "Hello" "This is the message body"');
    console.log('  node send-message.js "user@example.com" "Meeting" "See you at 3pm" "cc@example.com"');
    console.log('');
    console.log('JSON mode (from stdin):');
    console.log('  echo \'{"to":"a@b.com","subject":"Hi","body":"Hello"}\' | node send-message.js --json');
    process.exit(1);
  }

  await sendMessage(to, subject, body, cc, bcc);
}

main();
