#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

/**
 * OCR Extractor - Gemini를 활용한 이미지 OCR 및 마크다운 변환
 *
 * 특징:
 * - 병렬 처리 지원 (--concurrency 옵션)
 * - 파일 경로 기반 중복 체크 (이미 .md 파일 있으면 스킵)
 * - working/{디렉토리명}/ 구조로 결과 저장
 */

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];
const PDF_EXTENSIONS = ['.pdf'];
const ALL_EXTENSIONS = [...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS];

// 파일 타입 확인
function isPDF(filePath) {
  return PDF_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

function isImage(filePath) {
  return IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

// Gemini CLI로 OCR 수행
async function runOCR(filePath, prompt) {
  return new Promise((resolve, reject) => {
    const isPdf = isPDF(filePath);

    const maskingRule = `

## 개인정보 처리 규칙 (반드시 준수!)

**중요: 아래 규칙을 정확히 따르세요!**

1. **성명/이름**: 절대 마스킹하지 마세요! 원본 그대로 출력
   - (X) 정*** , 홍** → 틀림
   - (O) 정상일, 홍길동 → 정답

2. **주민등록번호**: 앞 6자리 + 뒷자리 첫 번째(성별)만 표시, 나머지 6자리만 마스킹
   - (X) 780903-******* → 틀림 (성별 안 보임)
   - (X) ******-******* → 틀림
   - (O) 780903-1****** → 정답 (1=남성 표시됨)
   - (O) 800101-2****** → 정답 (2=여성 표시됨)

3. **전화번호, 계좌번호, 주소**: 마스킹하지 마세요. 원본 그대로 출력`;

    const defaultPrompt = prompt || (isPdf
      ? `이 PDF 문서의 모든 텍스트를 추출해주세요.

다음 형식으로 마크다운을 작성해주세요:
1. 문서 제목 (있는 경우)
2. 주요 내용 (표, 리스트 등 구조 유지)
3. 숫자/금액은 정확하게
4. 날짜 형식 유지
5. 페이지가 여러 개인 경우 페이지별로 구분
${maskingRule}`
      : `이 이미지의 모든 텍스트를 추출해주세요.

다음 형식으로 마크다운을 작성해주세요:
1. 문서 제목 (있는 경우)
2. 주요 내용 (표, 리스트 등 구조 유지)
3. 숫자/금액은 정확하게
4. 날짜 형식 유지

텍스트가 없거나 이미지만 있는 경우 "[이미지: 간단한 설명]"으로 표시해주세요.
${maskingRule}`);

    const fileType = isPdf ? 'PDF 문서' : '이미지 파일';
    const args = [
      '--yolo',
      '--output-format', 'text',
      `${fileType} 분석: @${filePath}. ${defaultPrompt}`
    ];

    const geminiExecutable = '/Users/doha/.nvm/versions/node/v20.19.2/bin/gemini';



    const gemini = spawn(geminiExecutable, args, {
      stdio: ['pipe', 'pipe', 'pipe'], // Revert to pipes
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    gemini.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    gemini.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gemini.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Gemini failed with code ${code}: ${stderr}`));
      }
    });

    gemini.on('error', (err) => {
      reject(err);
    });
  });
}

// 단일 이미지 처리
async function processImage(imagePath, outputDir, options = {}) {
  const filename = path.basename(imagePath);
  const mdFilename = filename + '.md';  // image.jpg → image.jpg.md
  const mdPath = path.join(outputDir, mdFilename);

  // 이미 처리된 파일이면 스킵
  if (fs.existsSync(mdPath) && !options.force) {
    console.log(`⏭️  스킵 (이미 존재): ${filename}`);
    return {
      file: filename,
      status: 'skipped',
      outputPath: mdPath
    };
  }

  console.log(`🔍 OCR 처리 중: ${filename}`);

  try {
    const result = await runOCR(imagePath, options.prompt);

    // 마크다운 파일 생성
    const mdContent = `# ${filename}

> 원본: \`${imagePath}\`
> 처리: ${new Date().toISOString()}

---

${result}
`;

    fs.writeFileSync(mdPath, mdContent, 'utf8');

    console.log(`✅ 완료: ${filename}`);
    return {
      file: filename,
      status: 'success',
      outputPath: mdPath
    };

  } catch (error) {
    console.error(`❌ 실패: ${filename} - ${error.message}`);
    return {
      file: filename,
      status: 'error',
      error: error.message
    };
  }
}

// 병렬 처리 (concurrency 제한)
async function processWithConcurrency(items, concurrency, processFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = processFn(item).then(result => {
      executing.delete(promise);
      return result;
    });

    executing.add(promise);
    results.push(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// 디렉토리명 추출 (slack-files 경로에서)
// .crewx/slack-files/C09U0MUREEQ_1764157845.879449 → C09U0MUREEQ_1764157845.879449
// .crewx/slack-files/C09U0MUREEQ_1764157845.879449/resized → C09U0MUREEQ_1764157845.879449
function getOutputDirName(inputPath) {
  const resolved = path.resolve(inputPath);
  const parts = resolved.split(path.sep);

  // slack-files 이후의 스레드 ID를 찾음 (resized 무시)
  const slackFilesIdx = parts.indexOf('slack-files');
  if (slackFilesIdx !== -1 && parts[slackFilesIdx + 1]) {
    return parts[slackFilesIdx + 1]; // 스레드 ID (예: C09U0MUREEQ_1764157845.879449)
  }

  // slack-files 경로가 아니면 기존 로직
  const dirName = path.basename(inputPath);
  return dirName === 'resized' ? path.basename(path.dirname(inputPath)) : dirName;
}

// 메인 함수
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
OCR Extractor - Gemini를 활용한 이미지 OCR 및 마크다운 변환

Usage:
  node extractor.js --dir <이미지_디렉토리> [options]

Options:
  --dir <path>           이미지가 있는 디렉토리
  --output <path>        결과 저장 디렉토리 (기본: ./working/{디렉토리명})
  --concurrency <n>      동시 처리 개수 (기본: 2)
  --prompt <text>        커스텀 OCR 프롬프트
  --force                이미 처리된 파일도 재처리

Examples:
  # 디렉토리 전체 OCR
  node extractor.js --dir .crewx/slack-files/C09U0MUREEQ_123

  # 병렬 3개로 처리
  node extractor.js --dir ./images --concurrency 3

  # 강제 재처리
  node extractor.js --dir ./images --force
    `);
    process.exit(0);
  }

  // 옵션 파싱
  let inputDir = null;
  let singleImagePath = null; // New variable
  let outputDir = null;
  let concurrency = 2;
  let customPrompt = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dir' && args[i + 1]) {
      inputDir = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      outputDir = args[++i];
    } else if (arg === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[++i]) || 2;
    } else if (arg === '--prompt' && args[i + 1]) {
      customPrompt = args[++i];
    } else if (arg === '--force') {
      force = true;
    } else if (!arg.startsWith('--') && !inputDir && !singleImagePath) { // Add !singleImagePath
      if (fs.existsSync(arg)) { // Changed to just check existence
        if (fs.statSync(arg).isDirectory()) {
          inputDir = arg;
        } else if (fs.statSync(arg).isFile()) {
          singleImagePath = arg; // Assign to new variable
        }
      }
    }
  }

  // Input validation
  if (!inputDir && !singleImagePath) {
    console.error('❌ 입력 디렉토리 또는 이미지 파일을 지정해주세요. --help 참조');
    process.exit(1);
  }

  // 출력 디렉토리 설정: working/{디렉토리명}/
  if (!outputDir) {
    if (inputDir) {
      const dirName = getOutputDirName(inputDir);
      outputDir = path.join('./working', dirName);
    } else if (singleImagePath) {
      // 단일 파일도 동일한 로직 사용 (resized 폴더 무시, 스레드 ID 추출)
      const dirName = getOutputDirName(path.dirname(singleImagePath));
      outputDir = path.join('./working', dirName);
    }
  }

  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 처리할 파일 목록 수집
  // - 이미지: resized/ 폴더 우선, 없으면 원본 디렉토리
  // - PDF: 원본 디렉토리에서 직접
  let files = [];
  if (singleImagePath) {
    files.push(singleImagePath);
  } else if (inputDir) {
    const resizedDir = path.join(inputDir, 'resized');
    const hasResizedDir = fs.existsSync(resizedDir);

    // 이미지 파일 수집 (resized 우선)
    if (hasResizedDir) {
      console.log(`📁 리사이즈된 이미지 사용: ${resizedDir}`);
      const resizedImages = fs.readdirSync(resizedDir)
        .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
        .map(f => path.join(resizedDir, f));
      files.push(...resizedImages);
    } else {
      // resized 폴더 없으면 원본 디렉토리에서 이미지
      const originalImages = fs.readdirSync(inputDir)
        .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
        .map(f => path.join(inputDir, f));
      files.push(...originalImages);
    }

    // PDF 파일 수집 (항상 원본 디렉토리에서)
    const pdfFiles = fs.readdirSync(inputDir)
      .filter(f => PDF_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(inputDir, f));
    if (pdfFiles.length > 0) {
      console.log(`📄 PDF 파일: ${pdfFiles.length}개`);
      files.push(...pdfFiles);
    }
  }

  if (files.length === 0) {
    console.log('⚠️  처리할 파일이 없습니다. (이미지 또는 PDF)');
    process.exit(0);
  }

  console.log(`\n🚀 OCR 시작: ${files.length}개 파일, 동시 처리: ${concurrency}개`);
  console.log(`📂 출력 디렉토리: ${outputDir}\n`);

  // 병렬 처리
  const startTime = Date.now();
  const results = await processWithConcurrency(
    files,
    concurrency,
    (file) => processImage(file, outputDir, { prompt: customPrompt, force })
  );

  // 결과 요약
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`
=== OCR 완료 ===
📊 결과: 성공 ${successCount}개, 스킵 ${skippedCount}개, 실패 ${errorCount}개
⏱️  소요 시간: ${elapsed}초
📂 출력 위치: ${outputDir}
`);

  // 인덱스 파일 생성
  const indexContent = `# OCR 결과 인덱스

> 원본: \`${inputDir}\`
> 생성: ${new Date().toISOString()}
> 파일: ${results.length}개

## 파일 목록

${results.map(r => {
  if (r.status === 'success' || r.status === 'skipped') {
    const mdFile = path.basename(r.outputPath);
    return `- [${r.file}](./${mdFile})${r.status === 'skipped' ? ' (기존)' : ''}`;
  } else {
    return `- ❌ ${r.file} - ${r.error}`;
  }
}).join('\n')}

## 통계

| 항목 | 개수 |
|------|------|
| 성공 | ${successCount} |
| 스킵 | ${skippedCount} |
| 실패 | ${errorCount} |
| 소요 시간 | ${elapsed}초 |
`;

  fs.writeFileSync(path.join(outputDir, 'INDEX.md'), indexContent);
  console.log(`📋 인덱스: ${path.join(outputDir, 'INDEX.md')}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('치명적 오류:', err);
  process.exit(1);
});

module.exports = { processImage, runOCR };
