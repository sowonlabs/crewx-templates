#!/usr/bin/env node

/**
 * Upload File to Google Drive
 *
 * Usage:
 *   node upload-file.js <file-path> [options]
 *
 * Options:
 *   --folder <id>     Upload to specific folder (default: root)
 *   --name <name>     Rename file on upload
 *   --mime <type>     Force MIME type
 *
 * Examples:
 *   node upload-file.js "./report.pdf"
 *   node upload-file.js "./image.png" --folder 1ABC123xyz
 */

const fs = require('fs');
const path = require('path');
// const mime = require('mime-types'); // Removed dependency
const { getDriveClient, formatFileSize } = require('./drive-client');

// Simple mime lookup if mime-types is not available
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return map[ext] || 'application/octet-stream';
}

function parseArgs(args) {
  const result = {
    filePath: null,
    folderId: null,
    name: null,
    mimeType: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--folder' && args[i + 1]) {
      result.folderId = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      result.name = args[++i];
    } else if (args[i] === '--mime' && args[i + 1]) {
      result.mimeType = args[++i];
    } else if (!args[i].startsWith('--')) {
      result.filePath = args[i];
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node upload-file.js <file-path> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --folder <id>   Upload to specific folder (default: root)');
    console.log('  --name <name>   Rename file on upload');
    console.log('  --mime <type>   Force MIME type');
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const params = parseArgs(args);

  if (!params.filePath) {
    console.error('Error: file path is required');
    process.exit(1);
  }

  const absolutePath = path.resolve(params.filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: file not found at ${absolutePath}`);
    process.exit(1);
  }

  const fileName = params.name || path.basename(absolutePath);
  const mimeType = params.mimeType || getMimeType(absolutePath);
  const fileSize = fs.statSync(absolutePath).size;

  console.log(`Uploading ${fileName}...`);
  console.log(`Size: ${formatFileSize(fileSize)}`);
  console.log(`Type: ${mimeType}`);
  if (params.folderId) console.log(`Folder: ${params.folderId}`);
  console.log('');

  try {
    const drive = getDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: params.folderId ? [params.folderId] : undefined,
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(absolutePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    const file = response.data;

    console.log('✅ Upload successful!');
    console.log(`   ID: ${file.id}`);
    console.log(`   Name: ${file.name}`);
    console.log(`   Link: ${file.webViewLink}`);

  } catch (error) {
    console.error('❌ Error uploading file:', error.message);
    process.exit(1);
  }
}

main();
