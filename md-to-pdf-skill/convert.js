#!/usr/bin/env node
/**
 * Markdown to PDF 변환기
 *
 * Usage:
 *   node convert.js <input.md> [output.pdf]
 *   node convert.js <folder>  # 폴더 내 모든 .md 파일 변환
 */

const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const fs = require('fs');

// 한글 지원 CSS 스타일
const defaultStyle = `
body {
  font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #333;
  max-width: 100%;
  padding: 20px 40px;
}

h1 {
  font-size: 24pt;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-top: 30px;
}

h2 {
  font-size: 18pt;
  border-bottom: 1px solid #ccc;
  padding-bottom: 8px;
  margin-top: 25px;
}

h3 {
  font-size: 14pt;
  margin-top: 20px;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #fafafa;
}

code {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'D2Coding', 'Consolas', monospace;
  font-size: 10pt;
}

pre {
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

pre code {
  padding: 0;
  background: none;
}

blockquote {
  border-left: 4px solid #ddd;
  margin: 15px 0;
  padding: 10px 20px;
  background-color: #f9f9f9;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 25px 0;
}

ul, ol {
  padding-left: 25px;
}

li {
  margin: 5px 0;
}

strong {
  font-weight: 600;
}
`;

async function convertFile(inputPath, outputPath) {
  try {
    const pdf = await mdToPdf(
      { path: inputPath },
      {
        css: defaultStyle,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          },
          printBackground: true
        },
        launch_options: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }
    );

    if (pdf.content) {
      fs.writeFileSync(outputPath, pdf.content);
      console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
      return true;
    }
  } catch (error) {
    console.error(`✗ ${path.basename(inputPath)}: ${error.message}`);
    return false;
  }
}

async function convertFolder(folderPath) {
  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(folderPath, f));

  if (files.length === 0) {
    console.log('변환할 .md 파일이 없습니다.');
    return;
  }

  console.log(`${files.length}개 파일 변환 중...\n`);

  let success = 0;
  for (const file of files) {
    const output = file.replace(/\.md$/, '.pdf');
    if (await convertFile(file, output)) {
      success++;
    }
  }

  console.log(`\n완료: ${success}/${files.length} 파일 변환됨`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('사용법:');
    console.log('  node convert.js <input.md> [output.pdf]');
    console.log('  node convert.js <folder>');
    process.exit(1);
  }

  const input = path.resolve(args[0]);

  if (!fs.existsSync(input)) {
    console.error(`파일/폴더를 찾을 수 없습니다: ${input}`);
    process.exit(1);
  }

  const stat = fs.statSync(input);

  if (stat.isDirectory()) {
    await convertFolder(input);
  } else if (stat.isFile() && input.endsWith('.md')) {
    const output = args[1]
      ? path.resolve(args[1])
      : input.replace(/\.md$/, '.pdf');
    await convertFile(input, output);
  } else {
    console.error('입력은 .md 파일이거나 폴더여야 합니다.');
    process.exit(1);
  }
}

main().catch(console.error);
