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
    const options: AdOptions = {
      adId: getInterstitialId(),
    };
    await AdMob.prepareInterstitial(options);
    console.log('Interstitial ad prepared');
  } catch (error) {
    console.error('Failed to prepare interstitial:', error);
  }
}

// 전면 광고 표시
export async function showInterstitial(): Promise<boolean> {
  try {
    await AdMob.showInterstitial();
    console.log('Interstitial ad shown');
    // 다음 광고를 미리 준비
    prepareInterstitial();
    return true;
  } catch (error) {
    console.error('Failed to show interstitial:', error);
    // 실패해도 다음 광고 준비
    prepareInterstitial();
    return false;
  }
}

// ============ 보상형 광고 (Rewarded) ============

// 보상형 광고 준비
export async function prepareRewarded(): Promise<void> {
  try {
    const options: RewardAdOptions = {
      adId: getRewardedId(),
    };
    await AdMob.prepareRewardVideoAd(options);
    console.log('Rewarded ad prepared');
  } catch (error) {
    console.error('Failed to prepare rewarded:', error);
  }
}

// 보상형 광고 표시 및 보상 받기
export async function showRewarded(): Promise<boolean> {
  return new Promise(async (resolve) => {
    let rewardReceived = false;
    let rewardListener: { remove: () => Promise<void> } | null = null;
    let dismissListener: { remove: () => Promise<void> } | null = null;

    try {
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
      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('Failed to show rewarded:', error);
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
