import { AdMob, RewardAdPluginEvents, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import type { AdOptions, RewardAdOptions, AdMobRewardItem, AdLoadInfo, AdMobError } from '@capacitor-community/admob';

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
let isPreparingRewarded = false;  // 중복 prepare 방지
let isPreparingInterstitial = false;

// 현재 사용할 광고 ID
const getInterstitialId = () => IS_DEV_MODE ? AD_CONFIG.testInterstitialId : AD_CONFIG.interstitialId;
const getRewardedId = () => IS_DEV_MODE ? AD_CONFIG.testRewardedId : AD_CONFIG.rewardedId;

// ============ 글로벌 이벤트 리스너 설정 ============

function setupAdListeners(): void {
  // 보상형 광고 이벤트
  AdMob.addListener(RewardAdPluginEvents.Loaded, (info: AdLoadInfo) => {
    console.log('Rewarded ad loaded:', info);
    isRewardedAdReady = true;
    isPreparingRewarded = false;
  });

  AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: AdMobError) => {
    console.error('Rewarded ad failed to load:', error);
    isRewardedAdReady = false;
    isPreparingRewarded = false;
  });

  AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: AdMobError) => {
    console.error('Rewarded ad failed to show:', error);
    isRewardedAdReady = false;
    // 표시 실패 시 다시 준비
    prepareRewarded();
  });

  AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
    console.log('Rewarded ad dismissed');
    isRewardedAdReady = false;
    // 광고 닫힌 후 다음 광고 준비
    prepareRewarded();
  });

  // 전면 광고 이벤트
  AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
    console.log('Interstitial ad loaded:', info);
    isInterstitialAdReady = true;
    isPreparingInterstitial = false;
  });

  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
    console.error('Interstitial ad failed to load:', error);
    isInterstitialAdReady = false;
    isPreparingInterstitial = false;
  });

  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    console.log('Interstitial ad dismissed');
    isInterstitialAdReady = false;
    prepareInterstitial();
  });
}

// AdMob 초기화
export async function initializeAdMob(): Promise<void> {
  try {
    await AdMob.initialize({
      initializeForTesting: IS_DEV_MODE,
    });
    console.log('AdMob initialized successfully');
    // 이벤트 리스너 설정
    setupAdListeners();
  } catch (error) {
    console.error('AdMob initialization failed:', error);
  }
}

// ============ 전면 광고 (Interstitial) ============

// 전면 광고 준비
export async function prepareInterstitial(): Promise<void> {
  // 이미 준비 중이거나 준비된 상태면 스킵
  if (isPreparingInterstitial || isInterstitialAdReady) {
    return;
  }

  try {
    isPreparingInterstitial = true;
    const options: AdOptions = {
      adId: getInterstitialId(),
    };
    await AdMob.prepareInterstitial(options);
    // Loaded 이벤트에서 isInterstitialAdReady = true 설정됨
    console.log('Interstitial ad prepare requested');
  } catch (error) {
    isPreparingInterstitial = false;
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
    return true;
  } catch (error) {
    console.error('Failed to show interstitial:', error);
    isInterstitialAdReady = false;
    prepareInterstitial();
    return false;
  }
}

// ============ 보상형 광고 (Rewarded) ============

// 보상형 광고 준비
export async function prepareRewarded(): Promise<void> {
  // 이미 준비 중이거나 준비된 상태면 스킵
  if (isPreparingRewarded || isRewardedAdReady) {
    return;
  }

  try {
    isPreparingRewarded = true;
    const options: RewardAdOptions = {
      adId: getRewardedId(),
    };
    await AdMob.prepareRewardVideoAd(options);
    // Loaded 이벤트에서 isRewardedAdReady = true 설정됨
    console.log('Rewarded ad prepare requested');
  } catch (error) {
    isPreparingRewarded = false;
    isRewardedAdReady = false;
    console.error('Failed to prepare rewarded:', error);
  }
}

// 보상형 광고 준비 상태 확인
export function isRewardedReady(): boolean {
  return isRewardedAdReady;
}

// 보상형 광고 표시 및 보상 받기
export async function showRewarded(): Promise<boolean> {
  try {
    // 광고가 준비되지 않았으면 준비 후 재시도
    if (!isRewardedAdReady) {
      console.log('Rewarded ad not ready, preparing...');

      // 준비 중이 아니면 새로 준비
      if (!isPreparingRewarded) {
        isPreparingRewarded = true;
        const options: RewardAdOptions = {
          adId: getRewardedId(),
        };

        try {
          await AdMob.prepareRewardVideoAd(options);
          // prepareRewardVideoAd가 성공적으로 resolve되면 로드 완료
          isRewardedAdReady = true;
          isPreparingRewarded = false;
          console.log('Rewarded ad prepared inline');
        } catch (prepareError) {
          console.error('Failed to prepare rewarded inline:', prepareError);
          isPreparingRewarded = false;
          isRewardedAdReady = false;
          return false;
        }
      } else {
        // 준비 중이면 잠시 대기
        await new Promise(r => setTimeout(r, 2000));
        if (!isRewardedAdReady) {
          console.error('Rewarded ad still not ready after waiting');
          return false;
        }
      }
    }

    // 광고 표시 전 상태 갱신
    isRewardedAdReady = false;

    // 공식 패턴: showRewardVideoAd()가 보상 정보를 직접 반환
    const rewardItem: AdMobRewardItem = await AdMob.showRewardVideoAd();
    console.log('Reward received:', rewardItem);

    // 보상 받음 (rewardItem이 반환되면 성공)
    return true;

  } catch (error) {
    console.error('Failed to show rewarded:', error);
    isRewardedAdReady = false;
    // 실패 시 다음 광고 준비
    prepareRewarded();
    return false;
  }
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
