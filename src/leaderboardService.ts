import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from 'firebase/firestore';
import { PlayGames } from 'capacitor-play-games-services';

// GPGS 유저 타입
export interface GPGSUser {
  playerId: string;
  displayName: string;
}

// 현재 로그인된 유저 정보 저장
let currentGPGSUser: GPGSUser | null = null;

// 체스말 배수
const RANK_MULTIPLIERS: Record<string, number> = {
  pawn: 1,
  knight: 2,
  bishop: 3,
  rook: 5,
  queen: 8,
  king: 12,
  imperial: 20
};

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  score: number;
  chessPiece: string;
  platform: string;
  updatedAt: number;
}

export interface UserStats {
  userId: string;
  nickname: string;
  goldPerClick: number;
  attackPower: number;
  stonesDestroyed: number;
  chessPiece: string;
  prestigeCount: number;
  score: number;
  platform: string;
  updatedAt: number;
}

// 점수 계산
export function calculateScore(
  goldPerClick: number,
  attackPower: number,
  stonesDestroyed: number,
  chessPiece: string,
  prestigeCount: number
): number {
  const multiplier = (RANK_MULTIPLIERS[chessPiece] || 1) + (prestigeCount * 20);
  return Math.floor((goldPerClick + attackPower + stonesDestroyed) * multiplier);
}

// GPGS 로그인
export async function signInWithGoogle(): Promise<GPGSUser | null> {
  try {
    const result = await PlayGames.login();

    if (result.isLogin && result.id) {
      currentGPGSUser = {
        playerId: result.id,
        displayName: result.display_name || '플레이어'
      };
      return currentGPGSUser;
    }

    return null;
  } catch (error) {
    console.error('GPGS 로그인 실패:', error);
    return null;
  }
}

// 앱 시작 시 자동 로그인 체크
export async function handleRedirectResult(): Promise<GPGSUser | null> {
  try {
    const result = await PlayGames.status();

    if (result.isLogin) {
      // 이미 로그인되어 있으면 다시 login() 호출해서 유저 정보 가져오기
      const loginResult = await PlayGames.login();
      if (loginResult.isLogin && loginResult.id) {
        currentGPGSUser = {
          playerId: loginResult.id,
          displayName: loginResult.display_name || '플레이어'
        };
        return currentGPGSUser;
      }
    }

    return null;
  } catch (error) {
    console.error('GPGS 상태 확인 실패:', error);
    return null;
  }
}

// 로그아웃 (GPGS는 별도 로그아웃 API 없음 - 상태만 초기화)
export async function signOutUser(): Promise<void> {
  currentGPGSUser = null;
}

// 현재 유저 가져오기
export function getCurrentUser(): GPGSUser | null {
  return currentGPGSUser;
}

// 인증 상태 변화 감지 (GPGS는 실시간 감지 없음)
export function onAuthChange(callback: (user: GPGSUser | null) => void): () => void {
  // 초기 상태 콜백
  callback(currentGPGSUser);

  // GPGS는 실시간 리스너가 없으므로 빈 unsubscribe 반환
  return () => {};
}

// 점수 저장/업데이트
export async function saveScore(
  userId: string,
  nickname: string,
  goldPerClick: number,
  attackPower: number,
  stonesDestroyed: number,
  chessPiece: string,
  prestigeCount: number
): Promise<boolean> {
  try {
    const score = calculateScore(goldPerClick, attackPower, stonesDestroyed, chessPiece, prestigeCount);

    const userStats: UserStats = {
      userId,
      nickname,
      goldPerClick,
      attackPower,
      stonesDestroyed,
      chessPiece,
      prestigeCount,
      score,
      platform: 'google_play',
      updatedAt: Date.now()
    };

    await setDoc(doc(db, 'leaderboard', userId), userStats);
    return true;
  } catch (error) {
    console.error('점수 저장 실패:', error);
    return false;
  }
}

// 리더보드 조회 (상위 N명) - GPGS 유저만
export async function getLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'leaderboard'),
      where('platform', '==', 'google_play'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data() as UserStats;
      entries.push({
        rank: index + 1,
        userId: data.userId,
        nickname: data.nickname,
        score: data.score,
        chessPiece: data.chessPiece,
        platform: data.platform,
        updatedAt: data.updatedAt
      });
    });

    return entries;
  } catch (error) {
    console.error('리더보드 조회 실패:', error);
    return [];
  }
}

// 내 랭킹 조회
export async function getMyRank(userId: string): Promise<{ rank: number; entry: LeaderboardEntry | null }> {
  try {
    // 내 데이터 가져오기
    const myDoc = await getDoc(doc(db, 'leaderboard', userId));

    if (!myDoc.exists()) {
      return { rank: 0, entry: null };
    }

    const myData = myDoc.data() as UserStats;

    // 나보다 점수가 높은 사람 수 세기
    const q = query(
      collection(db, 'leaderboard'),
      where('score', '>', myData.score)
    );

    const snapshot = await getDocs(q);
    const rank = snapshot.size + 1;

    return {
      rank,
      entry: {
        rank,
        userId: myData.userId,
        nickname: myData.nickname,
        score: myData.score,
        chessPiece: myData.chessPiece,
        platform: myData.platform,
        updatedAt: myData.updatedAt
      }
    };
  } catch (error) {
    console.error('내 랭킹 조회 실패:', error);
    return { rank: 0, entry: null };
  }
}
