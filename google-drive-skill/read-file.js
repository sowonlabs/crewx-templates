#!/usr/bin/env node

/**
 * Read Google Drive File
 *
 * Usage:
 *   node read-file.js <file-id> [options]
 *
 * Options:
 *   --download <path>   Download file to local path
 *   --export <mime>     Export Google Doc to specific MIME type (e.g. application/pdf)
 *
 * Examples:
 *   node read-file.js 1ABC123xyz
 *   node read-file.js 1ABC123xyz --download ./my-doc.pdf
 */

const fs = require('fs');
const path = require('path');
const { getDriveClient, formatFileSize, formatDate, getFileIcon } = require('./drive-client');

function parseArgs(args) {
  const result = {
    fileId: null,
    downloadPath: null,
    exportMime: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--download' && args[i + 1]) {
      result.downloadPath = args[++i];
    } else if (args[i] === '--export' && args[i + 1]) {
      result.exportMime = args[++i];
    } else if (!args[i].startsWith('--')) {
      result.fileId = args[i];
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node read-file.js <file-id> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --download <path>   Download file to local path');
    console.log('  --export <mime>     Export Google Doc to specific MIME type');
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const params = parseArgs(args);

  if (!params.fileId) {
    console.error('Error: file ID is required');
    process.exit(1);
  }

  try {
    const drive = getDriveClient();

    // 1. Get Metadata
    const metaRes = await drive.files.get({
      fileId: params.fileId,
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink, description',
    });

    const file = metaRes.data;
    const isGoogleDoc = file.mimeType.startsWith('application/vnd.google-apps.');

    console.log('════════════════════════════════════════════════════════════════════');
    console.log(`${getFileIcon(file.mimeType)} ${file.name}`);
    console.log('──────────────────────────────────────────────────────────────────');
    console.log(`ID: ${file.id}`);
    console.log(`Type: ${file.mimeType}`);
    console.log(`Size: ${formatFileSize(file.size)}`);
    console.log(`Modified: ${formatDate(file.modifiedTime)}`);
    console.log(`Link: ${file.webViewLink}`);
    if (file.description) {
      console.log(`Description: ${file.description}`);
    }
    console.log('════════════════════════════════════════════════════════════════════');

    // 2. Handle Download/Export
    if (params.downloadPath) {
      const destPath = path.resolve(params.downloadPath);
      const destStream = fs.createWriteStream(destPath);

      console.log(`\n⬇️  Downloading to ${destPath}...`);

      if (isGoogleDoc) {
        // Export Google Docs
        let exportMime = params.exportMime;
        if (!exportMime) {
          // Default export formats
          if (file.mimeType.includes('document')) exportMime = 'text/plain'; // Default to text for CLI reading
          else if (file.mimeType.includes('spreadsheet')) exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; // Excel
          else if (file.mimeType.includes('presentation')) exportMime = 'application/pdf'; // PDF
          else exportMime = 'application/pdf';
        }

        console.log(`   Exporting as ${exportMime}...`);
        
        const res = await drive.files.export({
          fileId: params.fileId,
          mimeType: exportMime,
        }, { responseType: 'stream' });

        res.data.pipe(destStream);
      } else {
        // Download binary file
        const res = await drive.files.get({
          fileId: params.fileId,
          alt: 'media',
        }, { responseType: 'stream' });

        res.data.pipe(destStream);
      }

      await new Promise((resolve, reject) => {
        destStream.on('finish', resolve);
        destStream.on('error', reject);
      });

      console.log('✅ Download complete!');
    } else {
      // 3. Read Content (if text/doc)
      if (isGoogleDoc && file.mimeType.includes('document')) {
        console.log('\n📝 Content Preview (Text Export):');
        console.log('──────────────────────────────────────────────────────────────────');
        
        const res = await drive.files.export({
          fileId: params.fileId,
          mimeType: 'text/plain',
        });
        
        console.log(res.data);
      } else if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json') {
        console.log('\n📝 Content Preview:');
        console.log('──────────────────────────────────────────────────────────────────');
        
        const res = await drive.files.get({
          fileId: params.fileId,
          alt: 'media',
        }, { responseType: 'text' }); // Get as text
        
        // Truncate if too long for preview
        const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
        if (content.length > 2000) {
          console.log(content.substring(0, 2000));
          console.log('\n... (content truncated, use --download to see full file)');
        } else {
          console.log(content);
        }
      } else {
        console.log('\nℹ️  Binary file. Use --download <path> to save.');
      }
    }

  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    process.exit(1);
  }
}

main();
