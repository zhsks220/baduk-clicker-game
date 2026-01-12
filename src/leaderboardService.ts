import { db, auth, googleProvider } from './firebase';
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
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

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

// Google 로그인
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google 로그인 실패:', error);
    return null;
  }
}

// 로그아웃
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
}

// 현재 유저 가져오기
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// 인증 상태 변화 감지
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
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

// 리더보드 조회 (상위 N명)
export async function getLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'leaderboard'),
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
