#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Resize an image to reduce file size
 * Uses native Node.js canvas (no external dependencies for basic resizing)
 */
async function resizeImage(inputPath, outputPath, options = {}) {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    maxFileSizeMB = 1  // 1MB 기본값 (Gemini API 안정성)
  } = options;

  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Get file stats
    const stats = fs.statSync(inputPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    console.log(`Input file: ${inputPath}`);
    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);

    // If file is already small enough, just copy it
    if (fileSizeMB <= maxFileSizeMB) {
      console.log(`File size is already under ${maxFileSizeMB}MB, copying...`);
      fs.copyFileSync(inputPath, outputPath);
      return {
        success: true,
        inputSize: fileSizeMB,
        outputSize: fileSizeMB,
        outputPath
      };
    }

    // Try to use sharp if available, fallback to imagemagick
    try {
      const sharp = require('sharp');

      const image = sharp(inputPath);
      const metadata = await image.metadata();

      console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

      // Calculate new dimensions maintaining aspect ratio
      let newWidth = metadata.width;
      let newHeight = metadata.height;

      if (newWidth > maxWidth || newHeight > maxHeight) {
        const ratio = Math.min(maxWidth / newWidth, maxHeight / newHeight);
        newWidth = Math.round(newWidth * ratio);
        newHeight = Math.round(newHeight * ratio);
      }

      console.log(`Resizing to: ${newWidth}x${newHeight} with quality ${quality}`);

      await image
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      const outputSizeMB = outputStats.size / (1024 * 1024);

      console.log(`Output file size: ${outputSizeMB.toFixed(2)} MB`);

      return {
        success: true,
        inputSize: fileSizeMB,
        outputSize: outputSizeMB,
        outputPath,
        dimensions: { width: newWidth, height: newHeight }
      };

    } catch (sharpError) {
      console.log('Sharp not available, trying ImageMagick...');

      // Fallback to ImageMagick
      const { execSync } = require('child_process');

      try {
        // Check if convert command exists
        execSync('which convert', { stdio: 'ignore' });

        const resizeCmd = `convert "${inputPath}" -resize ${maxWidth}x${maxHeight}\\> -quality ${quality} "${outputPath}"`;
        execSync(resizeCmd);

        const outputStats = fs.statSync(outputPath);
        const outputSizeMB = outputStats.size / (1024 * 1024);

        console.log(`Output file size: ${outputSizeMB.toFixed(2)} MB`);

        return {
          success: true,
          inputSize: fileSizeMB,
          outputSize: outputSizeMB,
          outputPath
        };
      } catch (magickError) {
        throw new Error('Neither sharp nor ImageMagick is available. Please install one of them.');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch resize multiple images
 */
async function resizeImages(inputPaths, outputDir, options = {}) {
  const results = [];

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const inputPath of inputPaths) {
    const filename = path.basename(inputPath);
    const outputPath = path.join(outputDir, filename);

    console.log(`\n--- Processing: ${filename} ---`);
    const result = await resizeImage(inputPath, outputPath, options);
    results.push({ inputPath, ...result });
  }

  return results;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node resizer.js <input> [output] [options]

Options:
  --max-width <number>      Maximum width (default: 2048)
  --max-height <number>     Maximum height (default: 2048)
  --quality <number>        JPEG quality 1-100 (default: 85)
  --max-size <number>       Maximum file size in MB (default: 1)

Examples:
  # 단일 파일 리사이징
  node resizer.js input.jpg
  node resizer.js input.jpg output.jpg --quality 80

  # 디렉토리 전체 일괄 리사이징 (권장)
  node resizer.js --dir .crewx/slack-files/C09U0MUREEQ_1234567890/

  # glob 패턴으로 배치 처리
  node resizer.js "*.jpg" ./resized/ --max-width 1920
    `);
    process.exit(1);
  }

  const inputPath = args[0];
  let outputPath = args[1] || inputPath.replace(/(\.[^.]+)$/, '_resized$1');

  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--max-width' && args[i + 1]) {
      options.maxWidth = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--max-height' && args[i + 1]) {
      options.maxHeight = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--quality' && args[i + 1]) {
      options.quality = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--max-size' && args[i + 1]) {
      options.maxFileSizeMB = parseFloat(args[i + 1]);
      i++;
    }
  }

  // --dir 모드: 디렉토리 전체 일괄 처리 (최우선)
  if (inputPath === '--dir' && args[1]) {
    // 디렉토리 일괄 처리 모드
    const inputDir = args[1];
    const outputDir = path.join(inputDir, 'resized');

    if (!fs.existsSync(inputDir)) {
      console.error(`Directory not found: ${inputDir}`);
      process.exit(1);
    }

    // 이미지 파일 찾기
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const files = fs.readdirSync(inputDir)
      .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
      .filter(f => !f.includes('_resized'))  // 이미 리사이즈된 파일 제외
      .map(f => path.join(inputDir, f));

    if (files.length === 0) {
      console.log('No image files found in directory.');
      process.exit(0);
    }

    // 이미 resized 폴더에 있는 파일은 스킵
    const existingFiles = fs.existsSync(outputDir)
      ? new Set(fs.readdirSync(outputDir))
      : new Set();

    const filesToProcess = files.filter(f => {
      const filename = path.basename(f);
      if (existingFiles.has(filename)) {
        console.log(`Skipping (already exists): ${filename}`);
        return false;
      }
      return true;
    });

    if (filesToProcess.length === 0) {
      console.log('All files already processed. Nothing to do.');
      process.exit(0);
    }

    console.log(`Found ${filesToProcess.length} new image files to process (${files.length - filesToProcess.length} skipped)...`);
    resizeImages(filesToProcess, outputDir, options).then(results => {
      console.log('\n=== Summary ===');
      console.log(`Output directory: ${outputDir}`);
      let successCount = 0;
      results.forEach(r => {
        if (r.success) {
          successCount++;
          console.log(`✓ ${path.basename(r.inputPath)}: ${r.inputSize.toFixed(2)}MB → ${r.outputSize.toFixed(2)}MB`);
        } else {
          console.log(`✗ ${path.basename(r.inputPath)}: ${r.error}`);
        }
      });
      console.log(`\n${successCount}/${results.length} files processed successfully.`);
    });
  } else if (inputPath.includes('*')) {
    // glob 패턴 처리
    const { glob } = require('glob');
    const outputDir = args[1] || './resized';

    glob(inputPath).then(files => {
      if (files.length === 0) {
        console.log('No files matched the pattern.');
        process.exit(0);
      }
      return resizeImages(files, outputDir, options);
    }).then(results => {
      console.log('\n=== Summary ===');
      results.forEach(r => {
        if (r.success) {
          console.log(`✓ ${path.basename(r.inputPath)}: ${r.inputSize.toFixed(2)}MB → ${r.outputSize.toFixed(2)}MB`);
        } else {
          console.log(`✗ ${path.basename(r.inputPath)}: ${r.error}`);
        }
      });
    }).catch(err => {
      console.error('Glob error:', err);
      process.exit(1);
    });
  } else {
    // Single file
    resizeImage(inputPath, outputPath, options).then(result => {
      if (result.success) {
        console.log('\n✓ Resize completed successfully!');
      } else {
        console.error('\n✗ Resize failed');
        process.exit(1);
      }
    });
  }
}

module.exports = { resizeImage, resizeImages };
