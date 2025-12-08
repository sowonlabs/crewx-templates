#!/usr/bin/env node

/**
 * Get Google Drive File Information
 *
 * Usage:
 *   node get-file-info.js <file-id>
 *
 * Examples:
 *   node get-file-info.js 1ABC123xyz
 */

const { getDriveClient, formatFileSize, formatDate, getFileIcon } = require('./drive-client');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node get-file-info.js <file-id>');
    console.log('');
    console.log('Tip: Get file IDs from: node list-files.js or node search-files.js');
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const fileId = args[0];

  try {
    const drive = getDriveClient();

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, owners, sharingUser, webViewLink, webContentLink, parents, description, starred, trashed',
    });

    const file = response.data;
    const icon = getFileIcon(file.mimeType);

    console.log('');
    console.log(`${icon} ${file.name}`);
    console.log('='.repeat(60));
    console.log('');
    console.log(`ID: ${file.id}`);
    console.log(`Type: ${file.mimeType}`);

    if (file.size) {
      console.log(`Size: ${formatFileSize(file.size)}`);
    }

    console.log(`Created: ${formatDate(file.createdTime)}`);
    console.log(`Modified: ${formatDate(file.modifiedTime)}`);

    if (file.owners && file.owners.length > 0) {
      const ownerNames = file.owners.map(o => o.displayName || o.emailAddress).join(', ');
      console.log(`Owner: ${ownerNames}`);
    }

    if (file.description) {
      console.log(`Description: ${file.description}`);
    }

    console.log(`Starred: ${file.starred ? 'Yes' : 'No'}`);
    console.log(`Trashed: ${file.trashed ? 'Yes' : 'No'}`);

    console.log('');
    console.log('Links:');
    if (file.webViewLink) {
      console.log(`  View: ${file.webViewLink}`);
    }
    if (file.webContentLink) {
      console.log(`  Download: ${file.webContentLink}`);
    }

    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    if (error.code === 404) {
      console.error('Error: File not found');
    } else {
      console.error('Error getting file info:', error.message);
    }
    process.exit(1);
  }
}

main();
