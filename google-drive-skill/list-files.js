#!/usr/bin/env node

/**
 * List Google Drive Files
 *
 * Usage:
 *   node list-files.js [options]
 *
 * Options:
 *   --folder <id>     List files in specific folder (default: root)
 *   --limit <n>       Number of files to list (default: 20)
 *   --type <type>     Filter by type: folder, document, spreadsheet, image, etc.
 *
 * Examples:
 *   node list-files.js
 *   node list-files.js --limit 50
 *   node list-files.js --type folder
 *   node list-files.js --folder 1ABC123xyz
 */

const { getDriveClient, formatFileSize, formatDate, getFileIcon } = require('./drive-client');

function parseArgs(args) {
  const result = {
    folderId: 'root',
    limit: 20,
    type: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--folder' && args[i + 1]) {
      result.folderId = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[++i], 10);
    } else if (args[i] === '--type' && args[i + 1]) {
      result.type = args[++i];
    }
  }

  return result;
}

function getMimeTypeFilter(type) {
  const typeMap = {
    folder: 'application/vnd.google-apps.folder',
    document: 'application/vnd.google-apps.document',
    spreadsheet: 'application/vnd.google-apps.spreadsheet',
    presentation: 'application/vnd.google-apps.presentation',
    pdf: 'application/pdf',
    image: 'image/',
    video: 'video/',
    audio: 'audio/',
  };
  return typeMap[type] || null;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node list-files.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --folder <id>   List files in specific folder (default: root)');
    console.log('  --limit <n>     Number of files to list (default: 20)');
    console.log('  --type <type>   Filter by type: folder, document, spreadsheet, image, pdf, video, audio');
    process.exit(0);
  }

  const params = parseArgs(args);

  console.log('Fetching files from Google Drive...');
  console.log('');

  try {
    const drive = getDriveClient();

    // Build query
    let query = `'${params.folderId}' in parents and trashed = false`;

    if (params.type) {
      const mimeType = getMimeTypeFilter(params.type);
      if (mimeType) {
        if (mimeType.endsWith('/')) {
          query += ` and mimeType contains '${mimeType}'`;
        } else {
          query += ` and mimeType = '${mimeType}'`;
        }
      }
    }

    const response = await drive.files.list({
      q: query,
      pageSize: params.limit,
      fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];

    if (files.length === 0) {
      console.log('No files found.');
      return;
    }

    console.log(`Found ${files.length} files:`);
    console.log('');
    console.log('-'.repeat(80));

    files.forEach((file, index) => {
      const icon = getFileIcon(file.mimeType);
      const size = formatFileSize(file.size);
      const modified = formatDate(file.modifiedTime);

      console.log(`${icon} ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Size: ${size} | Modified: ${modified}`);
      if (file.webViewLink) {
        console.log(`   Link: ${file.webViewLink}`);
      }
      console.log('');
    });

    console.log('-'.repeat(80));
    console.log('');
    console.log('To download a file: node download-file.js <file-id>');
    console.log('To search files: node search-files.js "keyword"');

  } catch (error) {
    console.error('Error listing files:', error.message);
    process.exit(1);
  }
}

main();
