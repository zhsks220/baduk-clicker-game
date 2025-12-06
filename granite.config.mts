import { defineConfig } from '@anthropic/granite';

export default defineConfig({
  // 앱 기본 정보
  app: {
    name: '바둑돌 부수기',
    version: '1.0.0',
    description: '체스말로 바둑돌을 부수는 클릭커 게임',
  },

  // 토스 앱인앱 설정
  toss: {
    // 앱 타입
    appType: 'game',

    // 연령 등급
    ageRating: 'all', // 전체이용가

    // 내비게이션 설정
    navigation: {
      showMoreButton: true,  // 더보기(⋯) 버튼 표시
      showCloseButton: true, // 닫기(✕) 버튼 표시
      exitConfirmation: true, // 종료 시 확인 모달 표시
    },

    // 화면 설정
    display: {
      fullscreen: true, // 풀스크린 모드
      orientation: 'portrait', // 세로 모드 고정
      safeAreaInsets: true, // Safe Area 대응
    },

    // 터치 설정
    touch: {
      minTouchTarget: 44, // 최소 터치 영역 44px
    },
  },

  // 빌드 설정
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true,
  },

  // 앱 아이콘 (600x600px PNG 필요)
  icons: {
    appIcon: './public/app-icon.png',
  },

  // 권한 설정
  permissions: {
    vibration: true, // 진동 피드백
    storage: true, // 로컬 저장소 (게임 진행 저장)
  },
});
