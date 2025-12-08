#!/usr/bin/env node
/**
 * 슬랙 파일 업로드 스크립트 (Node.js)
 *
 * 사용법:
 *   node slack-upload.mjs <channel_id> <file_path> [options]
 *
 * 옵션:
 *   --thread_ts, -t  스레드 타임스탬프
 *   --message, -m    파일과 함께 보낼 메시지
 *   --token          슬랙 봇 토큰 (기본: 환경변수 SLACK_BOT_TOKEN)
 *
 * 예시:
 *   node slack-upload.mjs C09U0MUREEQ ./reports/result.pdf
 *   node slack-upload.mjs C09U0MUREEQ ./reports/result.pdf -t 1732123456.123456
 *   node slack-upload.mjs C09U0MUREEQ ./reports/result.pdf -m "분석 결과입니다"
 *
 * 필요한 슬랙 앱 권한:
 *   - files:write (파일 업로드)
 *   - chat:write (채널에 메시지 전송)
 */

import { WebClient } from "@slack/web-api";
import { readFileSync, existsSync } from "fs";
import { basename, resolve } from "path";
import { config } from "dotenv";

// .env.slack 파일 로드
config({ path: ".env.slack" });

/**
 * 슬랙에 파일 업로드
 */
async function uploadFile({ channelId, filePath, threadTs, message, token }) {
  const botToken = token || process.env.SLACK_BOT_TOKEN;

  if (!botToken) {
    console.error("❌ SLACK_BOT_TOKEN이 설정되지 않았습니다");
    process.exit(1);
  }

  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${absolutePath}`);
    process.exit(1);
  }

  const client = new WebClient(botToken);
  const filename = basename(absolutePath);
  const fileContent = readFileSync(absolutePath);

  try {
    // files.uploadV2 사용 (최신 API)
    const result = await client.filesUploadV2({
      channel_id: channelId,
      file: fileContent,
      filename: filename,
      title: filename,
      initial_comment: message,
      thread_ts: threadTs,
    });

    console.log(`✅ 파일 업로드 성공: ${filename}`);
    console.log(`   채널: ${channelId}`);
    if (threadTs) {
      console.log(`   스레드: ${threadTs}`);
    }
    if (result.files && result.files[0]) {
      console.log(`   URL: ${result.files[0].permalink || "N/A"}`);
    }

    return result;
  } catch (error) {
    const errorCode = error.data?.error || error.message;

    switch (errorCode) {
      case "missing_scope":
        console.error("❌ 오류: files:write 권한이 없습니다");
        console.error(
          "   슬랙 앱 설정에서 files:write 스코프를 추가하고 재설치하세요"
        );
        break;
      case "channel_not_found":
        console.error(`❌ 오류: 채널을 찾을 수 없습니다: ${channelId}`);
        console.error("   봇이 해당 채널에 초대되어 있는지 확인하세요");
        break;
      case "not_in_channel":
        console.error(`❌ 오류: 봇이 채널에 없습니다: ${channelId}`);
        console.error("   채널에서 /invite @봇이름 으로 봇을 초대하세요");
        break;
      default:
        console.error(`❌ 슬랙 API 오류: ${errorCode}`);
    }
    process.exit(1);
  }
}

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    channelId: process.env.SLACK_CHANNEL_ID || null,
    filePath: null,
    threadTs: process.env.SLACK_THREAD_TS || null,
    message: null,
    token: null,
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--thread_ts" || arg === "-t") {
      result.threadTs = args[++i];
    } else if (arg === "--message" || arg === "-m") {
      result.message = args[++i];
    } else if (arg === "--token") {
      result.token = args[++i];
    } else if (arg === "--channel" || arg === "-c") {
      result.channelId = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  // 위치 인자 처리: 첫 번째가 channel_id인지 file_path인지 판단
  if (positional.length >= 2) {
    // 둘 다 제공: channel_id file_path
    result.channelId = positional[0];
    result.filePath = positional[1];
  } else if (positional.length === 1) {
    // 하나만 제공: file_path (channel_id는 환경변수에서)
    result.filePath = positional[0];
  }

  if (!result.filePath) {
    console.error("❌ file_path가 필요합니다\n");
    printHelp();
    process.exit(1);
  }

  if (!result.channelId) {
    console.error("❌ channel_id가 필요합니다 (인자 또는 SLACK_CHANNEL_ID 환경변수)\n");
    printHelp();
    process.exit(1);
  }

  return result;
}

function printHelp() {
  console.log(`
슬랙 파일 업로드 스크립트

사용법:
  node slack-upload.mjs <file_path> [options]
  node slack-upload.mjs <channel_id> <file_path> [options]

옵션:
  --channel, -c    채널 ID (기본: 환경변수 SLACK_CHANNEL_ID)
  --thread_ts, -t  스레드 타임스탬프 (기본: 환경변수 SLACK_THREAD_TS)
  --message, -m    파일과 함께 보낼 메시지
  --token          슬랙 봇 토큰 (기본: 환경변수 SLACK_BOT_TOKEN)
  --help, -h       도움말 표시

환경변수:
  SLACK_CHANNEL_ID   기본 채널 ID
  SLACK_THREAD_TS    기본 스레드 타임스탬프
  SLACK_BOT_TOKEN    슬랙 봇 토큰

예시:
  # 환경변수 사용 (파일만 지정)
  node slack-upload.mjs ./reports/result.pdf -m "결과입니다"

  # 채널/스레드 직접 지정
  node slack-upload.mjs C09U0MUREEQ ./reports/result.pdf -t 1732123456.123456
`);
}

// 메인 실행
const args = parseArgs(process.argv.slice(2));
await uploadFile(args);
