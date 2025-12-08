#!/usr/bin/env node

/**
 * Search Google Drive Files
 *
 * Usage:
 *   node search-files.js <query> [options]
 *
 * Options:
 *   --limit <n>       Number of results (default: 20)
 *   --type <type>     Filter by type: folder, document, spreadsheet, image, etc.
 *
 * Examples:
 *   node search-files.js "project report"
 *   node search-files.js "budget" --type spreadsheet
 *   node search-files.js "meeting notes" --limit 10
 */

const { getDriveClient, formatFileSize, formatDate, getFileIcon } = require('./drive-client');

function parseArgs(args) {
  const result = {
    query: null,
    limit: 20,
    type: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[++i], 10);
    } else if (args[i] === '--type' && args[i + 1]) {
      result.type = args[++i];
    } else if (!args[i].startsWith('--')) {
      result.query = args[i];
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

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node search-files.js <query> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --limit <n>     Number of results (default: 20)');
    console.log('  --type <type>   Filter by type: folder, document, spreadsheet, image, pdf');
    console.log('');
    console.log('Examples:');
    console.log('  node search-files.js "project report"');
    console.log('  node search-files.js "budget" --type spreadsheet');
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const params = parseArgs(args);

  if (!params.query) {
    console.error('Error: search query is required');
    process.exit(1);
  }

  console.log(`Searching for "${params.query}"...`);
  console.log('');

  try {
    const drive = getDriveClient();

    // Build query - search in name and fullText
    let query = `(name contains '${params.query}' or fullText contains '${params.query}') and trashed = false`;

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
      console.log('No files found matching your query.');
      return;
    }

    console.log(`Found ${files.length} files:`);
    console.log('');
    console.log('-'.repeat(80));

    files.forEach((file) => {
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

  } catch (error) {
    console.error('Error searching files:', error.message);
    process.exit(1);
  }
}

main();
