import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import type { AdOptions, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';

// 광고 ID 설정
const AD_CONFIG = {
  // 실제 광고 ID (프로덕션용)
  interstitialId: 'ca-app-pub-7735932028043375/6850824629',
  rewardedId: 'ca-app-pub-7735932028043375/8515260082',

  // 테스트 광고 ID (개발용)
  testInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
  testRewardedId: 'ca-app-pub-3940256099942544/5224354917',
};

// 개발 모드 여부 (true면 테스트 광고 사용)
const IS_DEV_MODE = false; // 프로덕션 모드

// 광고 준비 상태 추적
let isRewardedAdReady = false;
let isInterstitialAdReady = false;

// 현재 사용할 광고 ID
const getInterstitialId = () => IS_DEV_MODE ? AD_CONFIG.testInterstitialId : AD_CONFIG.interstitialId;
const getRewardedId = () => IS_DEV_MODE ? AD_CONFIG.testRewardedId : AD_CONFIG.rewardedId;

// AdMob 초기화
export async function initializeAdMob(): Promise<void> {
  try {
    await AdMob.initialize({
      initializeForTesting: IS_DEV_MODE,
    });
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('AdMob initialization failed:', error);
  }
}

// ============ 전면 광고 (Interstitial) ============

// 전면 광고 준비
export async function prepareInterstitial(): Promise<void> {
  try {
    isInterstitialAdReady = false;
    const options: AdOptions = {
      adId: getInterstitialId(),
    };
    await AdMob.prepareInterstitial(options);
    isInterstitialAdReady = true;
    console.log('Interstitial ad prepared');
  } catch (error) {
    isInterstitialAdReady = false;
    console.error('Failed to prepare interstitial:', error);
  }
}

// 전면 광고 표시
export async function showInterstitial(): Promise<boolean> {
  try {
    // 광고가 준비되지 않았으면 스킵
    if (!isInterstitialAdReady) {
      console.log('Interstitial ad not ready, skipping...');
      prepareInterstitial();
      return false;
    }
    isInterstitialAdReady = false;
    await AdMob.showInterstitial();
    console.log('Interstitial ad shown');
    // 다음 광고를 미리 준비
    prepareInterstitial();
    return true;
  } catch (error) {
    console.error('Failed to show interstitial:', error);
    isInterstitialAdReady = false;
    // 실패해도 다음 광고 준비
    prepareInterstitial();
    return false;
  }
}

// ============ 보상형 광고 (Rewarded) ============

// 보상형 광고 준비
export async function prepareRewarded(): Promise<void> {
  try {
    isRewardedAdReady = false;
    const options: RewardAdOptions = {
      adId: getRewardedId(),
    };
    await AdMob.prepareRewardVideoAd(options);
    isRewardedAdReady = true;
    console.log('Rewarded ad prepared');
  } catch (error) {
    isRewardedAdReady = false;
    console.error('Failed to prepare rewarded:', error);
  }
}

// 보상형 광고 준비 상태 확인
export function isRewardedReady(): boolean {
  return isRewardedAdReady;
}

// 광고가 준비될 때까지 대기 (최대 3초)
async function waitForRewardedAd(maxWaitMs: number = 3000): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 200; // 200ms마다 체크

  while (Date.now() - startTime < maxWaitMs) {
    if (isRewardedAdReady) {
      return true;
    }
    await new Promise(r => setTimeout(r, checkInterval));
  }
  return isRewardedAdReady;
}

// 보상형 광고 표시 및 보상 받기
export async function showRewarded(): Promise<boolean> {
  return new Promise(async (resolve) => {
    let rewardReceived = false;
    let rewardListener: { remove: () => Promise<void> } | null = null;
    let dismissListener: { remove: () => Promise<void> } | null = null;

    try {
      // 광고가 준비되지 않았으면 준비 시도 후 대기
      if (!isRewardedAdReady) {
        console.log('Rewarded ad not ready, preparing...');
        prepareRewarded();
        const isReady = await waitForRewardedAd(3000);
        if (!isReady) {
          console.error('Rewarded ad failed to load in time');
          resolve(false);
          return;
        }
      }

      // 보상 이벤트 리스너 설정
      rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward: AdMobRewardItem) => {
          console.log('Reward received:', reward);
          rewardReceived = true;
        }
      );

      // 광고 닫힘 이벤트
      dismissListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          console.log('Rewarded ad dismissed, reward received:', rewardReceived);
          // 광고 표시됨 = 더 이상 준비 상태 아님
          isRewardedAdReady = false;
          // 리스너 정리
          rewardListener?.remove();
          dismissListener?.remove();
          // 다음 광고를 미리 준비
          prepareRewarded();
          // 보상 여부에 따라 resolve
          resolve(rewardReceived);
        }
      );

      // 광고 표시
      isRewardedAdReady = false; // 표시 시도하면 준비 상태 해제
      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('Failed to show rewarded:', error);
      isRewardedAdReady = false;
      // 리스너 정리
      rewardListener?.remove();
      dismissListener?.remove();
      // 실패해도 다음 광고 준비
      prepareRewarded();
      resolve(false);
    }
  });
}

// ============ 초기화 및 광고 준비 ============

// 앱 시작 시 호출
export async function setupAds(): Promise<void> {
  await initializeAdMob();
  // 광고들을 미리 준비해둠
  await Promise.all([
    prepareInterstitial(),
    prepareRewarded(),
  ]);
}
