---
sidebar_position: 1
---

# 시작하기

문서에 오신 것을 환영합니다!

## 빠른 시작

의존성을 설치하여 시작하세요:

```bash
npm install
```

## 개발

개발 서버를 시작합니다:

```bash
npm start
```

이 명령은 로컬 개발 서버를 시작하고 브라우저 창을 엽니다. 대부분의 변경사항은 서버를 재시작하지 않고도 실시간으로 반영됩니다.

## 빌드

프로덕션 사이트를 빌드합니다:

```bash
npm run build
```

이 명령은 `build` 디렉토리에 정적 콘텐츠를 생성하며, 어떤 정적 콘텐츠 호스팅 서비스를 사용해서도 제공할 수 있습니다.

## 번역 워크플로우

이 사이트는 CrewX로 구동되는 자동 번역 워크플로우를 사용합니다:

1. **한글로 작성** - `i18n/ko/docusaurus-plugin-content-blog/`에 블로그 포스트 작성
2. **확인** - `npm run translate:check`를 실행하여 미번역 포스트 확인
3. **번역** - `npm run translate:ko-to-en`을 실행하여 자동으로 영어로 번역

[번역 워크플로우](./translation)에 대해 더 알아보세요.
