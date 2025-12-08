#!/usr/bin/env node
// 간단한 Markdown→PDF 변환기 (포트 바인딩 없이 동작)
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node inline.js <input.md> [output.pdf]');
  process.exit(1);
}

const resolvedInput = path.resolve(inputPath);
const outputPath = path.resolve(process.argv[3] || resolvedInput.replace(/\.md$/, '.pdf'));
if (!fs.existsSync(resolvedInput)) {
  console.error(`입력 파일을 찾을 수 없습니다: ${resolvedInput}`);
  process.exit(1);
}

const markdown = fs.readFileSync(resolvedInput, 'utf8');
const style = `
  body { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 11pt; line-height: 1.6; color: #333; padding: 20px 40px; }
  h1 { font-size: 24pt; border-bottom: 2px solid #333; padding-bottom: 10px; margin-top: 30px; }
  h2 { font-size: 18pt; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-top: 25px; }
  h3 { font-size: 14pt; margin-top: 20px; }
  table { border-collapse: collapse; width: 100%; margin: 15px 0; }
  th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
  th { background-color: #f5f5f5; font-weight: bold; }
  tr:nth-child(even) { background-color: #fafafa; }
  blockquote { border-left: 4px solid #ddd; margin: 15px 0; padding: 10px 20px; background-color: #f9f9f9; }
  hr { border: none; border-top: 1px solid #ddd; margin: 25px 0; }
`;

const html = `<!doctype html><html><head><meta charset="UTF-8"><style>${style}</style></head><body>${marked.parse(markdown)}</body></html>`;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
  await browser.close();
  console.log(`✓ ${path.basename(resolvedInput)} → ${path.basename(outputPath)}`);
})().catch((err) => {
  console.error('변환 중 오류 발생:', err.message);
  process.exit(1);
});
