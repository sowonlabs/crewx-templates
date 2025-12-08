#!/usr/bin/env node

/**
 * Download Google Drive File
 *
 * Usage:
 *   node download-file.js <file-id> [options]
 *
 * Options:
 *   --output <path>   Output file path (default: original filename)
 *   --export <format> Export Google Docs/Sheets/Slides to format:
 *                     document: pdf, docx, txt, html, odt, rtf
 *                     spreadsheet: xlsx, pdf, csv, ods
 *                     presentation: pptx, pdf, odp
 *
 * Examples:
 *   node download-file.js 1ABC123xyz
 *   node download-file.js 1ABC123xyz --output ./downloads/file.pdf
 *   node download-file.js 1ABC123xyz --export pdf
 */

const fs = require('fs');
const path = require('path');
const { getDriveClient, formatFileSize } = require('./drive-client');

const EXPORT_MIME_TYPES = {
  // Document exports
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  html: 'text/html',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
  // Spreadsheet exports
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  // Presentation exports
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp: 'application/vnd.oasis.opendocument.presentation',
};

function parseArgs(args) {
  const result = {
    fileId: null,
    output: null,
    exportFormat: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      result.output = args[++i];
    } else if (args[i] === '--export' && args[i + 1]) {
      result.exportFormat = args[++i];
    } else if (!args[i].startsWith('--')) {
      result.fileId = args[i];
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node download-file.js <file-id> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --output <path>   Output file path');
    console.log('  --export <format> Export format: pdf, docx, xlsx, csv, pptx, etc.');
    console.log('');
    console.log('Tip: Get file IDs from: node list-files.js or node search-files.js');
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const params = parseArgs(args);

  if (!params.fileId) {
    console.error('Error: file-id is required');
    process.exit(1);
  }

  try {
    const drive = getDriveClient();

    // Get file metadata first
    console.log('Fetching file info...');
    const fileInfo = await drive.files.get({
      fileId: params.fileId,
      fields: 'id, name, mimeType, size',
    });

    const file = fileInfo.data;
    console.log(`File: ${file.name}`);
    console.log(`Type: ${file.mimeType}`);
    if (file.size) {
      console.log(`Size: ${formatFileSize(file.size)}`);
    }
    console.log('');

    // Determine if this is a Google Workspace file that needs export
    const isGoogleDoc = file.mimeType.startsWith('application/vnd.google-apps.');

    let outputPath = params.output;
    let downloadStream;

    if (isGoogleDoc) {
      // Export Google Workspace file
      const exportFormat = params.exportFormat || 'pdf';
      const exportMimeType = EXPORT_MIME_TYPES[exportFormat];

      if (!exportMimeType) {
        console.error(`Unknown export format: ${exportFormat}`);
        console.error('Supported formats: pdf, docx, txt, xlsx, csv, pptx');
        process.exit(1);
      }

      console.log(`Exporting as ${exportFormat}...`);

      if (!outputPath) {
        const baseName = path.parse(file.name).name;
        outputPath = `${baseName}.${exportFormat}`;
      }

      const response = await drive.files.export({
        fileId: params.fileId,
        mimeType: exportMimeType,
      }, { responseType: 'stream' });

      downloadStream = response.data;

    } else {
      // Download regular file
      console.log('Downloading...');

      if (!outputPath) {
        outputPath = file.name;
      }

      const response = await drive.files.get({
        fileId: params.fileId,
        alt: 'media',
      }, { responseType: 'stream' });

      downloadStream = response.data;
    }

    // Save to file
    const dest = fs.createWriteStream(outputPath);

    await new Promise((resolve, reject) => {
      downloadStream
        .on('error', reject)
        .pipe(dest)
        .on('error', reject)
        .on('finish', resolve);
    });

    console.log('');
    console.log(`Downloaded to: ${outputPath}`);

  } catch (error) {
    if (error.code === 404) {
      console.error('Error: File not found');
    } else {
      console.error('Error downloading file:', error.message);
    }
    process.exit(1);
  }
}

main();
