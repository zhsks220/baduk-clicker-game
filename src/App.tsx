import { useState, useEffect } from 'react';
import { create } from 'zustand';
import './App.css';

// Assets (2D Characters)
// King is missing due to quota, reusing Queen for now (logic handles this)
// SVG Components
import { PawnIcon, KnightIcon, BishopIcon, RookIcon, QueenIcon, KingIcon, ImperialKingIcon } from './components/ChessIcons';
import { StoneBlackIcon, StoneWhiteIcon, StoneBossRed, StoneBossBlue, StoneBossGreen, StoneBossPurple, StoneBossGold, StoneBossCyan, StoneBossRainbow } from './components/StoneIcons';
import { MILITARY_RANK_ICONS } from './components/MilitaryRankIcons';
import { soundManager } from './utils/SoundManager';

// ============ 타입 정의 ============
type ChessPieceRank = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' | 'imperial';
type StoneColor = 'black' | 'white';
type StoneSize = 'small' | 'medium' | 'large';
type BossType = 'none' | 'boss1' | 'boss2' | 'boss3' | 'boss4' | 'boss5' | 'boss6' | 'boss7';

interface GoStone {
  color: StoneColor;
  size: StoneSize;
  maxHp: number;
  currentHp: number;
  isBoss: boolean;
  bossType?: BossType;
}

interface ChessPiece {
  rank: ChessPieceRank;
  level: number;
  displayName: string;
  emoji: string;
}

interface UpgradeStat {
  id: string;
  name: string;
  level: number;
  baseValue: number;
  increment: number;
  baseCost: number;
  costMultiplier: number;
}

interface AutoClicker {
  id: string;
  name: string;
  emoji: string;
  clicksPerSec: number;
  baseCost: number;
  count: number;
}

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  goldCost: number;
  rubyCost: number;
  count: number;
}

interface Mission {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  reward: { gold: number; ruby: number };
  completed: boolean;
  claimed: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  target: number;
  reward: { gold: number; ruby: number };
  unlocked: boolean;
}

// ============ 상수 정의 ============
// Mapping ranks to images
const CHESS_PIECES: Record<ChessPieceRank, Omit<ChessPiece, 'level'>> = {
  pawn: { rank: 'pawn', displayName: '폰', emoji: '♟️' },
  knight: { rank: 'knight', displayName: '나이트', emoji: '♞' },
  bishop: { rank: 'bishop', displayName: '비숍', emoji: '♝' },
  rook: { rank: 'rook', displayName: '룩', emoji: '♜' },
  queen: { rank: 'queen', displayName: '퀸', emoji: '♛' },
  king: { rank: 'king', displayName: '킹', emoji: '♚' }, // Placeholder: Queen
  imperial: { rank: 'imperial', displayName: '킹갓제네럴임페리얼 체스킹', emoji: '👑' },
};

const RANK_ORDER: ChessPieceRank[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'imperial'];

// 체스 랭크별 공격력 배율 (임페리얼 20x로 엔딩)
const RANK_MULTIPLIERS: Record<ChessPieceRank, number> = {
  pawn: 1,
  knight: 2,
  bishop: 3,
  rook: 5,
  queen: 8,
  king: 12,
  imperial: 20,
};

// 군대 계급 17단계 강화 시스템 (ENHANCE_RATES에서 name으로 사용)
// const MILITARY_RANKS = [
//   '이병', '일병', '상병', '병장',     // 병사 (0-3)
//   '하사', '중사', '상사',             // 부사관 (4-6)
//   '소위', '중위', '대위',             // 위관 (7-9)
//   '소령', '중령', '대령',             // 영관 (10-12)
//   '준장', '소장', '중장', '대장'      // 장성 (13-16)
// ];

// 계급별 공격력 배율 (대장 = 80x)
const MILITARY_POWER_MULTIPLIERS = [
  1.0, 1.2, 1.5, 2.0,      // 이병~병장
  2.5, 3.2, 4.0,           // 하사~상사
  5.0, 6.5, 8.0,           // 소위~대위
  10, 15, 22,              // 소령~대령
  32, 45, 60, 80           // 준장~대장
];

// ============ 밸런스 설계 (F2P 30일 엔딩, 7만원=15일 엔딩) ============
// 복리 성장 감안: 업그레이드×계급×체스 곱연산 효과 포함
// F2P 30일 획득 예상: 약 6,500억 / 총 필요: 약 6,300억
// 1사이클(이병→대장): 약 452억, 7사이클: 약 3,164억 (성공시)
const ENHANCE_RATES = [
  // 병사 (초반 빠른 진행, 파괴 없음)
  { level: 0, name: '이병', successRate: 100, cost: 1000, destroyRate: 0 },
  { level: 1, name: '일병', successRate: 100, cost: 5000, destroyRate: 0 },
  { level: 2, name: '상병', successRate: 95, cost: 20000, destroyRate: 0 },
  { level: 3, name: '병장', successRate: 90, cost: 80000, destroyRate: 0 },
  // 부사관 (중반 도전, 파괴 시작)
  { level: 4, name: '하사', successRate: 85, cost: 250000, destroyRate: 5 },
  { level: 5, name: '중사', successRate: 80, cost: 800000, destroyRate: 8 },
  { level: 6, name: '상사', successRate: 75, cost: 2000000, destroyRate: 10 },
  // 위관 (중후반, 본격적인 파괴 리스크)
  { level: 7, name: '소위', successRate: 70, cost: 5000000, destroyRate: 12 },
  { level: 8, name: '중위', successRate: 65, cost: 15000000, destroyRate: 15 },
  { level: 9, name: '대위', successRate: 60, cost: 40000000, destroyRate: 18 },
  // 영관 (후반, 높은 비용과 리스크)
  { level: 10, name: '소령', successRate: 55, cost: 100000000, destroyRate: 20 },
  { level: 11, name: '중령', successRate: 50, cost: 300000000, destroyRate: 22 },
  { level: 12, name: '대령', successRate: 45, cost: 800000000, destroyRate: 25 },
  // 장성 (엔드게임, 최고 난이도)
  { level: 13, name: '준장', successRate: 40, cost: 2000000000, destroyRate: 28 },
  { level: 14, name: '소장', successRate: 35, cost: 5000000000, destroyRate: 30 },
  { level: 15, name: '중장', successRate: 30, cost: 12000000000, destroyRate: 32 },
  { level: 16, name: '대장', successRate: 25, cost: 25000000000, destroyRate: 0 }, // 대장은 파괴 없음 (진화 직전)
];

// 업그레이드 비용 (F2P 30일 기준 - 복리효과 감안)
const INITIAL_UPGRADES: UpgradeStat[] = [
  { id: 'goldPerClick', name: '클릭당 골드', level: 1, baseValue: 1, increment: 1, baseCost: 50, costMultiplier: 1.18 },
  { id: 'attackPower', name: '공격력', level: 1, baseValue: 1, increment: 1, baseCost: 100, costMultiplier: 1.20 },
  { id: 'critChance', name: '치명타 확률', level: 0, baseValue: 0, increment: 5, baseCost: 200, costMultiplier: 1.25 },
  { id: 'critDamage', name: '치명타 데미지', level: 0, baseValue: 150, increment: 10, baseCost: 300, costMultiplier: 1.22 },
];

// 동료 시스템 (F2P 30일 기준 - baseCost 3배 증가, 복리효과 감안)
// 초반 빠른 진행 → 중반 성장 → 후반 안정적 DPS
const INITIAL_AUTO_CLICKERS: AutoClicker[] = [
  { id: 'finger', name: '보조 손가락', emoji: '👆', clicksPerSec: 1, baseCost: 1500, count: 0 },       // 초반용
  { id: 'fan', name: '부채', emoji: '🪭', clicksPerSec: 3, baseCost: 9000, count: 0 },                // 병사급
  { id: 'sword', name: '검', emoji: '⚔️', clicksPerSec: 8, baseCost: 45000, count: 0 },               // 부사관급
  { id: 'magic', name: '마법봉', emoji: '🪄', clicksPerSec: 20, baseCost: 240000, count: 0 },         // 위관급
  { id: 'knight', name: '기사', emoji: '🛡️', clicksPerSec: 50, baseCost: 1200000, count: 0 },        // 영관급
  { id: 'wizard', name: '마법사', emoji: '🧙', clicksPerSec: 120, baseCost: 6000000, count: 0 },      // 장성급
  { id: 'dragon', name: '드래곤', emoji: '🐉', clicksPerSec: 300, baseCost: 45000000, count: 0 },     // 엔드게임
];

// 상점 아이템 (캐시템 추가 - 7만원 = 7000 루비 기준)
const INITIAL_SHOP_ITEMS: ShopItem[] = [
  // 강화 보조 아이템 (루비)
  { id: 'protectScroll', name: '파괴방지권', emoji: '🛡️', description: '강화 실패시 파괴 방지', goldCost: 0, rubyCost: 100, count: 0 },
  { id: 'blessScroll', name: '축복주문서', emoji: '✨', description: '성공 확률 +10%', goldCost: 0, rubyCost: 150, count: 0 },
  { id: 'luckyScroll', name: '행운주문서', emoji: '🍀', description: '성공 확률 +20%', goldCost: 0, rubyCost: 250, count: 0 },
  { id: 'superScroll', name: '신성주문서', emoji: '🌟', description: '성공 확률 +30%', goldCost: 0, rubyCost: 400, count: 0 },
  // 부스터 (골드/루비)
  { id: 'goldBoost', name: '골드 부스터', emoji: '💰', description: '30분간 골드 2배', goldCost: 50000, rubyCost: 0, count: 0 },
  { id: 'autoBoost', name: '자동 부스터', emoji: '⚡', description: '30분간 자동클릭 2배', goldCost: 100000, rubyCost: 0, count: 0 },
  { id: 'megaBoost', name: '메가 부스터', emoji: '🚀', description: '1시간 모든 효과 2배', goldCost: 0, rubyCost: 300, count: 0 },
  // VIP 패키지 (프리미엄 캐시)
  { id: 'vipPass', name: 'VIP 패스 (30일)', emoji: '👑', description: '골드+50%, 오프라인+100%', goldCost: 0, rubyCost: 3000, count: 0 },
  { id: 'starterPack', name: '스타터 패키지', emoji: '🎁', description: '파괴방지x10, 축복x10, 500만골드', goldCost: 0, rubyCost: 1500, count: 0 },
  { id: 'growthPack', name: '성장 패키지', emoji: '📈', description: '영구 공격력 +20%', goldCost: 0, rubyCost: 2000, count: 0 },
];

const INITIAL_MISSIONS: Mission[] = [
  { id: 'click100', name: '열심히 클릭!', description: '100번 클릭', target: 100, current: 0, reward: { gold: 500, ruby: 5 }, completed: false, claimed: false },
  { id: 'click500', name: '클릭 마스터', description: '500번 클릭', target: 500, current: 0, reward: { gold: 2000, ruby: 10 }, completed: false, claimed: false },
  { id: 'enhance5', name: '강화 도전', description: '강화 5번 시도', target: 5, current: 0, reward: { gold: 1000, ruby: 5 }, completed: false, claimed: false },
  { id: 'gold10k', name: '부자 되기', description: '1만 골드 모으기', target: 10000, current: 0, reward: { gold: 0, ruby: 15 }, completed: false, claimed: false },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstEnhance', name: '첫 강화', description: '강화 성공', target: 1, reward: { gold: 1000, ruby: 10 }, unlocked: false },
  { id: 'knight', name: '나이트 승급', description: '나이트 달성', target: 1, reward: { gold: 5000, ruby: 20 }, unlocked: false },
  { id: 'bishop', name: '비숍 승급', description: '비숍 달성', target: 1, reward: { gold: 10000, ruby: 30 }, unlocked: false },
  { id: 'rook', name: '룩 승급', description: '룩 달성', target: 1, reward: { gold: 25000, ruby: 50 }, unlocked: false },
  { id: 'queen', name: '퀸 승급', description: '퀸 달성', target: 1, reward: { gold: 50000, ruby: 100 }, unlocked: false },
];

const STORAGE_KEY = 'pony-game-v3';

// 바둑돌 설정 (Stone Styles for CSS) - HP 20배 증가
const STONE_CONFIG: Record<StoneSize, { hpMultiplier: number; pixelSize: number }> = {
  small: { hpMultiplier: 20, pixelSize: 80 },
  medium: { hpMultiplier: 40, pixelSize: 110 },
  large: { hpMultiplier: 80, pixelSize: 150 },
};

// 보스 설정 - 7개 보스 (F2P 30일 기준)
// 보스 HP = 권장 공격력 x 500~1000타, 보상 = 강화 비용 일부 지원 (100개당 1보스)
const BOSS_CONFIG: Record<BossType, { name: string; fixedHp: number; goldReward: number; element: string }> = {
  none: { name: '', fixedHp: 1, goldReward: 0, element: '' },
  boss1: { name: '화염의 돌', fixedHp: 500, goldReward: 5000, element: '🔴' },             // 폰 초반 (공격력 ~1)
  boss2: { name: '빙결의 돌', fixedHp: 5000, goldReward: 50000, element: '🔵' },           // 나이트 중반 (공격력 ~4)
  boss3: { name: '맹독의 돌', fixedHp: 50000, goldReward: 500000, element: '🟢' },         // 비숍 대위 (공격력 ~24)
  boss4: { name: '암흑의 돌', fixedHp: 300000, goldReward: 2000000, element: '🟣' },       // 룩 소령 (공격력 ~50)
  boss5: { name: '번개의 돌', fixedHp: 2000000, goldReward: 10000000, element: '🟡' },     // 퀸 대령 (공격력 ~176)
  boss6: { name: '사이버 돌', fixedHp: 15000000, goldReward: 50000000, element: '💠' },    // 킹 소장 (공격력 ~540)
  boss7: { name: '궁극의 돌', fixedHp: 80000000, goldReward: 200000000, element: '🌈' },   // 임페리얼 대장 (공격력 ~1600)
};

const BOSS_ORDER: BossType[] = ['boss1', 'boss2', 'boss3', 'boss4', 'boss5', 'boss6', 'boss7'];
const STONES_PER_BOSS = 100; // 100개 파괴마다 보스 등장 (F2P 30일 기준)

const createRandomStone = (playerDps: number): GoStone => {
  const colors: StoneColor[] = ['black', 'white'];
  // 작은돌 50%, 중간돌 35%, 큰돌 15%
  const rand = Math.random();
  let size: StoneSize = 'small';
  if (rand > 0.85) size = 'large';
  else if (rand > 0.5) size = 'medium';

  const color = colors[Math.floor(Math.random() * colors.length)];
  const config = STONE_CONFIG[size];

  // HP should scale with player power to keep game interesting
  const baseHp = Math.max(10, playerDps * 5);
  const hp = Math.floor(baseHp * config.hpMultiplier);

  return {
    color,
    size,
    maxHp: hp,
    currentHp: hp,
    isBoss: false,
    bossType: 'none',
  };
};

// 보스 생성 함수 (고정 HP 사용)
const createBossStone = (_playerDps: number, bossIndex: number): GoStone => {
  const bossType = BOSS_ORDER[bossIndex % BOSS_ORDER.length];
  const bossConfig = BOSS_CONFIG[bossType];

  // 보스 HP는 고정값 사용
  const hp = bossConfig.fixedHp;

  return {
    color: 'black', // 보스는 색상 무관
    size: 'large',  // 보스는 항상 큰 사이즈
    maxHp: hp,
    currentHp: hp,
    isBoss: true,
    bossType: bossType,
  };
};

const formatNumber = (n: number): string => {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + '조';
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '억';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '만';
  return n.toLocaleString();
};

const getUpgradeCost = (upgrade: UpgradeStat): number => {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
};

const getAutoClickerCost = (clicker: AutoClicker): number => {
  return Math.floor(clicker.baseCost * Math.pow(1.20, clicker.count));
};

// ============ Zustand 스토어 ============
interface GameState {
  gold: number;
  ruby: number;
  totalGold: number;
  totalClicks: number;
  currentStone: GoStone;
  stonesDestroyed: number;
  bossesDefeated: number;           // 처치한 보스 수
  stonesUntilBoss: number;          // 보스까지 남은 바둑돌 수
  currentPiece: ChessPiece;
  upgrades: UpgradeStat[];
  autoClickers: AutoClicker[];
  autoClicksPerSec: number;
  enhanceAttempts: number;
  enhanceSuccesses: number;
  shopItems: ShopItem[];
  goldBoostEndTime: number;
  autoBoostEndTime: number;
  missions: Mission[];
  achievements: Achievement[];
  dailyMissionDate: string;
  prestigeCount: number;
  prestigeBonus: number;
  lastOnlineTime: number;
  upgradeCount: number;
  goldPerClick: number;
  attackPower: number;
  critChance: number;
  critDamage: number;

  handleClick: () => { gold: number; isCrit: boolean; destroyed: boolean; bonusGold: number };
  upgradestat: (statId: string) => boolean;
  buyAutoClicker: (clickerId: string) => boolean;
  tryEnhance: (useProtect: boolean, useBlessing: number) => { success: boolean; destroyed: boolean; message: string };
  buyShopItem: (itemId: string) => boolean;
  useBooster: (boosterId: string) => boolean;
  claimMissionReward: (missionId: string) => boolean;
  claimAchievement: (achievementId: string) => boolean;
  doPrestige: () => { success: boolean; rubyEarned: number };
  collectOfflineReward: () => { gold: number; time: number };
  autoTick: () => void;
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
  checkMissions: () => void;
  checkAchievements: () => void;
  resetDailyMissions: () => void;
}

// 공격력 계산: 체스랭크 배율 x 군대계급 배율 x 업그레이드
const calculateStats = (upgrades: UpgradeStat[], piece: ChessPiece, prestigeBonus: number) => {
  // 체스 랭크 배율 (폰 1x ~ 임페리얼 20x)
  const rankMultiplier = RANK_MULTIPLIERS[piece.rank];

  // 군대 계급 배율 (이병 1x ~ 대장 80x)
  const militaryMultiplier = MILITARY_POWER_MULTIPLIERS[piece.level] || 1;

  // 프레스티지 보너스
  const prestige = 1 + prestigeBonus;

  const goldUpgrade = upgrades.find(u => u.id === 'goldPerClick')!;
  const attackUpgrade = upgrades.find(u => u.id === 'attackPower')!;
  const critChanceUpgrade = upgrades.find(u => u.id === 'critChance')!;
  const critDamageUpgrade = upgrades.find(u => u.id === 'critDamage')!;

  // 기본 공격력 = 업그레이드 값 x 랭크 배율 x 계급 배율
  const baseAttack = attackUpgrade.baseValue + attackUpgrade.increment * (attackUpgrade.level - 1);
  const baseGold = goldUpgrade.baseValue + goldUpgrade.increment * (goldUpgrade.level - 1);

  return {
    goldPerClick: Math.max(1, Math.floor(baseGold * rankMultiplier * militaryMultiplier * prestige)), // 골드도 동일한 배율
    attackPower: Math.floor(baseAttack * rankMultiplier * militaryMultiplier * prestige),
    critChance: Math.min(100, critChanceUpgrade.baseValue + critChanceUpgrade.increment * critChanceUpgrade.level),
    critDamage: critDamageUpgrade.baseValue + critDamageUpgrade.increment * critDamageUpgrade.level,
  };
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const useGameStore = create<GameState>((set, get) => ({
  gold: 0,
  ruby: 0,
  totalGold: 0,
  totalClicks: 0,
  currentStone: createRandomStone(1),
  stonesDestroyed: 0,
  bossesDefeated: 0,
  stonesUntilBoss: STONES_PER_BOSS,
  currentPiece: { ...CHESS_PIECES.pawn, level: 0 },
  upgrades: INITIAL_UPGRADES.map(u => ({ ...u })),
  autoClickers: INITIAL_AUTO_CLICKERS.map(c => ({ ...c })),
  autoClicksPerSec: 0,
  enhanceAttempts: 0,
  enhanceSuccesses: 0,
  shopItems: INITIAL_SHOP_ITEMS.map(i => ({ ...i })),
  goldBoostEndTime: 0,
  autoBoostEndTime: 0,
  missions: INITIAL_MISSIONS.map(m => ({ ...m })),
  achievements: ACHIEVEMENTS.map(a => ({ ...a })),
  dailyMissionDate: getTodayString(),
  prestigeCount: 0,
  prestigeBonus: 0,
  lastOnlineTime: Date.now(),
  upgradeCount: 0,
  goldPerClick: 1,
  attackPower: 1,
  critChance: 0,
  critDamage: 150,

  handleClick: () => {
    const state = get();
    const isCrit = Math.random() * 100 < state.critChance;
    let baseGold = state.goldPerClick;

    if (Date.now() < state.goldBoostEndTime) {
      baseGold *= 2;
    }

    const earnedGold = isCrit ? Math.floor(baseGold * state.critDamage / 100) : baseGold;
    const damage = state.attackPower;
    const newHp = Math.max(0, state.currentStone.currentHp - damage);
    const destroyed = newHp <= 0;

    let bonusGold = 0;
    if (destroyed) {
      // 보스 처치 시 고정 보상, 일반 돌은 HP 기반 보상
      if (state.currentStone.isBoss) {
        bonusGold = BOSS_CONFIG[state.currentStone.bossType || 'none'].goldReward;
      } else {
        const totalStoneGold = state.currentStone.maxHp * baseGold * 0.1;
        const bonusPercent = [33, 66, 99][Math.floor(Math.random() * 3)];
        bonusGold = Math.floor(totalStoneGold * bonusPercent / 100);
      }
    }
    const totalGoldEarned = earnedGold + bonusGold;

    if (destroyed) {
      const wasKillingBoss = state.currentStone.isBoss;
      let newStonesUntilBoss = state.stonesUntilBoss;
      let newBossesDefeated = state.bossesDefeated;
      let nextStone: GoStone;

      if (wasKillingBoss) {
        // 보스 처치 완료
        newBossesDefeated = state.bossesDefeated + 1;
        newStonesUntilBoss = STONES_PER_BOSS;
        nextStone = createRandomStone(state.attackPower);
      } else {
        // 일반 돌 파괴
        newStonesUntilBoss = state.stonesUntilBoss - 1;

        if (newStonesUntilBoss <= 0) {
          // 보스 등장!
          nextStone = createBossStone(state.attackPower, state.bossesDefeated);
          newStonesUntilBoss = 0; // 보스전 중에는 0 유지
        } else {
          nextStone = createRandomStone(state.attackPower);
        }
      }

      set(s => ({
        gold: s.gold + totalGoldEarned,
        totalGold: s.totalGold + totalGoldEarned,
        totalClicks: s.totalClicks + 1,
        currentStone: nextStone,
        stonesDestroyed: s.stonesDestroyed + (wasKillingBoss ? 0 : 1),
        stonesUntilBoss: newStonesUntilBoss,
        bossesDefeated: newBossesDefeated,
      }));
    } else {
      set(s => ({
        gold: s.gold + earnedGold,
        totalGold: s.totalGold + earnedGold,
        totalClicks: s.totalClicks + 1,
        currentStone: { ...s.currentStone, currentHp: newHp },
      }));
    }

    get().checkMissions();
    get().checkAchievements();
    return { gold: earnedGold, isCrit, destroyed, bonusGold };
  },

  upgradestat: (statId: string) => {
    const state = get();
    const upgradeIndex = state.upgrades.findIndex(u => u.id === statId);
    if (upgradeIndex === -1) return false;

    const upgrade = state.upgrades[upgradeIndex];
    const cost = getUpgradeCost(upgrade);
    if (state.gold < cost) return false;

    const newUpgrades = [...state.upgrades];
    newUpgrades[upgradeIndex] = { ...upgrade, level: upgrade.level + 1 };
    const newStats = calculateStats(newUpgrades, state.currentPiece, state.prestigeBonus);

    set({ gold: state.gold - cost, upgrades: newUpgrades, upgradeCount: state.upgradeCount + 1, ...newStats });
    get().checkMissions();
    return true;
  },

  buyAutoClicker: (clickerId: string) => {
    const state = get();
    const clickerIndex = state.autoClickers.findIndex(c => c.id === clickerId);
    if (clickerIndex === -1) return false;

    const clicker = state.autoClickers[clickerIndex];
    const cost = getAutoClickerCost(clicker);
    if (state.gold < cost) return false;

    const newClickers = [...state.autoClickers];
    newClickers[clickerIndex] = { ...clicker, count: clicker.count + 1 };
    const newAutoClicksPerSec = newClickers.reduce((sum, c) => sum + c.clicksPerSec * c.count, 0);

    set({ gold: state.gold - cost, autoClickers: newClickers, autoClicksPerSec: newAutoClicksPerSec });
    return true;
  },

  tryEnhance: (useProtect: boolean, useBlessing: number) => {
    const state = get();
    const currentLevel = state.currentPiece.level;
    const enhanceInfo = ENHANCE_RATES[currentLevel];
    if (!enhanceInfo || state.gold < enhanceInfo.cost) {
      return { success: false, destroyed: false, message: '비용 부족 또는 최대 레벨' };
    }

    const protectItem = state.shopItems.find(i => i.id === 'protectScroll');
    const blessItem = state.shopItems.find(i => i.id === 'blessScroll');
    const luckyItem = state.shopItems.find(i => i.id === 'luckyScroll');

    if (useProtect && (!protectItem || protectItem.count < 1)) return { success: false, destroyed: false, message: '파괴방지권 부족' };
    if (useBlessing === 1 && (!blessItem || blessItem.count < 1)) return { success: false, destroyed: false, message: '축복주문서 부족' };
    if (useBlessing === 2 && (!luckyItem || luckyItem.count < 1)) return { success: false, destroyed: false, message: '행운주문서 부족' };

    const newShopItems = state.shopItems.map(item => {
      if (useProtect && item.id === 'protectScroll') return { ...item, count: item.count - 1 };
      if (useBlessing === 1 && item.id === 'blessScroll') return { ...item, count: item.count - 1 };
      if (useBlessing === 2 && item.id === 'luckyScroll') return { ...item, count: item.count - 1 };
      return item;
    });

    set(s => ({ gold: s.gold - enhanceInfo.cost, enhanceAttempts: s.enhanceAttempts + 1, shopItems: newShopItems }));

    let successRate = enhanceInfo.successRate;
    if (useBlessing === 1) successRate += 10;
    if (useBlessing === 2) successRate += 20;

    const roll = Math.random() * 100;
    if (roll < successRate) {
      const newLevel = currentLevel + 1;
      // 17단계 시스템: 16(대장)에서 다음 체스말로 승급
      if (newLevel > 16) {
        // Rank Up Logic - 체스말 승급
        const currentRankIndex = RANK_ORDER.indexOf(state.currentPiece.rank);
        if (currentRankIndex >= RANK_ORDER.length - 1) {
          // 이미 최고 체스말(imperial)이면 레벨 유지
          return { success: false, destroyed: false, message: '이미 최고 등급입니다!' };
        }
        const nextRank = RANK_ORDER[currentRankIndex + 1];
        const newPiece = { ...CHESS_PIECES[nextRank], level: 0 };
        const newStats = calculateStats(state.upgrades, newPiece, state.prestigeBonus);
        set(s => ({ currentPiece: newPiece, enhanceSuccesses: s.enhanceSuccesses + 1, ...newStats }));
        get().checkAchievements();
        return { success: true, destroyed: false, message: `🎉 승급 성공! ${newPiece.displayName} (이병)` };
      }
      const newPiece = { ...state.currentPiece, level: newLevel };
      const newStats = calculateStats(state.upgrades, newPiece, state.prestigeBonus);
      set(s => ({ currentPiece: newPiece, enhanceSuccesses: s.enhanceSuccesses + 1, ...newStats }));
      get().checkMissions();
      get().checkAchievements();
      // 계급명 표시
      const rankNames = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '소위', '중위', '대위', '소령', '중령', '대령', '준장', '소장', '중장', '대장'];
      return { success: true, destroyed: false, message: `강화 성공! ${rankNames[newLevel]}` };
    }

    const destroyRoll = Math.random() * 100;
    if (destroyRoll < enhanceInfo.destroyRate && !useProtect) {
      const resetPiece = { ...state.currentPiece, level: 0 };
      const newStats = calculateStats(state.upgrades, resetPiece, state.prestigeBonus);
      set({ currentPiece: resetPiece, ...newStats });
      return { success: false, destroyed: true, message: '장비 파괴됨 (+0 초기화)' };
    }

    return { success: false, destroyed: false, message: useProtect && destroyRoll < enhanceInfo.destroyRate ? '방어 성공 (강화 실패)' : '강화 실패' };
  },

  buyShopItem: (itemId: string) => {
    const state = get();
    const itemIndex = state.shopItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return false;
    const item = state.shopItems[itemIndex];
    if ((item.goldCost > 0 && state.gold < item.goldCost) || (item.rubyCost > 0 && state.ruby < item.rubyCost)) return false;

    const newItems = [...state.shopItems];
    newItems[itemIndex] = { ...item, count: item.count + 1 };
    set({ gold: state.gold - item.goldCost, ruby: state.ruby - item.rubyCost, shopItems: newItems });
    return true;
  },

  useBooster: (boosterId: string) => {
    const state = get();
    const itemIndex = state.shopItems.findIndex(i => i.id === boosterId);
    if (itemIndex === -1 || state.shopItems[itemIndex].count < 1) return false;
    const newItems = [...state.shopItems];
    newItems[itemIndex] = { ...newItems[itemIndex], count: newItems[itemIndex].count - 1 };

    if (boosterId === 'goldBoost') set({ shopItems: newItems, goldBoostEndTime: Date.now() + 300000 });
    else if (boosterId === 'autoBoost') set({ shopItems: newItems, autoBoostEndTime: Date.now() + 300000 });
    return true;
  },

  claimMissionReward: (missionId: string) => {
    const state = get();
    const idx = state.missions.findIndex(m => m.id === missionId);
    if (idx === -1 || !state.missions[idx].completed || state.missions[idx].claimed) return false;
    const newMissions = [...state.missions];
    newMissions[idx] = { ...newMissions[idx], claimed: true };
    set({ gold: state.gold + newMissions[idx].reward.gold, ruby: state.ruby + newMissions[idx].reward.ruby, missions: newMissions });
    return true;
  },

  claimAchievement: (achId: string) => {
    const state = get();
    const idx = state.achievements.findIndex(a => a.id === achId);
    if (idx === -1 || !state.achievements[idx].unlocked) return false;
    set({ gold: state.gold + state.achievements[idx].reward.gold, ruby: state.ruby + state.achievements[idx].reward.ruby }); // Achievement usually one time, but here we just give reward and keep visible
    return true;
  },

  doPrestige: () => {
    const state = get();
    const rankIndex = RANK_ORDER.indexOf(state.currentPiece.rank);
    if (rankIndex < 1) return { success: false, rubyEarned: 0 };

    const rubyEarned = (rankIndex + 1) * (state.currentPiece.level + 1) * 10;
    const newPrestigeBonus = state.prestigeBonus + 0.1;
    const initialStats = calculateStats(INITIAL_UPGRADES, { ...CHESS_PIECES.pawn, level: 0 }, newPrestigeBonus);

    set({
      gold: 0, totalGold: 0, totalClicks: 0, currentPiece: { ...CHESS_PIECES.pawn, level: 0 },
      upgrades: INITIAL_UPGRADES.map(u => ({ ...u })), autoClickers: INITIAL_AUTO_CLICKERS.map(c => ({ ...c })),
      autoClicksPerSec: 0, enhanceAttempts: 0, enhanceSuccesses: 0, upgradeCount: 0,
      ruby: state.ruby + rubyEarned, prestigeCount: state.prestigeCount + 1, prestigeBonus: newPrestigeBonus,
      currentStone: createRandomStone(initialStats.attackPower),
      ...initialStats
    });
    return { success: true, rubyEarned };
  },

  collectOfflineReward: () => {
    const state = get();
    const now = Date.now();
    const offlineTime = Math.min(now - state.lastOnlineTime, 28800000);
    if (offlineTime < 60000) { set({ lastOnlineTime: now }); return { gold: 0, time: 0 }; }

    const goldEarned = Math.floor(state.goldPerClick * state.autoClicksPerSec * 0.5 * (offlineTime / 1000));
    set({ gold: state.gold + goldEarned, totalGold: state.totalGold + goldEarned, lastOnlineTime: now });
    return { gold: goldEarned, time: offlineTime };
  },

  autoTick: () => {
    const state = get();
    if (state.autoClicksPerSec === 0) return;

    let goldMultiplier = 1;
    let autoMultiplier = 1;
    if (Date.now() < state.goldBoostEndTime) goldMultiplier *= 2;
    if (Date.now() < state.autoBoostEndTime) autoMultiplier *= 2;

    const autoClicks = state.autoClicksPerSec * autoMultiplier;
    const totalDamage = state.attackPower * autoClicks;
    const totalGoldEarned = Math.floor(state.goldPerClick * autoClicks * goldMultiplier);

    let newHp = state.currentStone.currentHp - totalDamage;
    let currentStone = state.currentStone;
    let destroyed = 0;
    let bonusGold = 0;
    let newStonesUntilBoss = state.stonesUntilBoss;
    let newBossesDefeated = state.bossesDefeated;

    // 바둑돌/보스 파괴 처리
    while (newHp <= 0) {
      const wasKillingBoss = currentStone.isBoss;

      // 파괴 보너스 골드 (보스는 고정 보상, 일반 돌은 HP 기반)
      if (wasKillingBoss) {
        bonusGold += BOSS_CONFIG[currentStone.bossType || 'none'].goldReward;
      } else {
        const stoneBonus = Math.floor(currentStone.maxHp * state.goldPerClick * 0.1);
        bonusGold += stoneBonus;
      }

      if (wasKillingBoss) {
        newBossesDefeated++;
        newStonesUntilBoss = STONES_PER_BOSS;
        currentStone = createRandomStone(state.attackPower);
      } else {
        destroyed++;
        newStonesUntilBoss--;

        if (newStonesUntilBoss <= 0) {
          currentStone = createBossStone(state.attackPower, newBossesDefeated);
          newStonesUntilBoss = 0;
        } else {
          currentStone = createRandomStone(state.attackPower);
        }
      }

      newHp = currentStone.currentHp + newHp;
    }

    set(s => ({
      gold: s.gold + totalGoldEarned + bonusGold,
      totalGold: s.totalGold + totalGoldEarned + bonusGold,
      currentStone: { ...currentStone, currentHp: Math.max(0, newHp) },
      stonesDestroyed: s.stonesDestroyed + destroyed,
      stonesUntilBoss: newStonesUntilBoss,
      bossesDefeated: newBossesDefeated,
    }));

    get().checkMissions();
  },

  checkMissions: () => {
    const s = get();
    const newMissions = s.missions.map(m => {
      if (m.claimed) return m;
      let c = 0;
      if (m.id === 'click100' || m.id === 'click500') c = s.totalClicks;
      else if (m.id === 'enhance5') c = s.enhanceAttempts;
      else if (m.id === 'gold10k') c = s.gold;
      return { ...m, current: c, completed: c >= m.target };
    });
    set({ missions: newMissions });
  },

  checkAchievements: () => {
    const s = get();
    const rank = RANK_ORDER.indexOf(s.currentPiece.rank);
    const newAchs = s.achievements.map(a => {
      if (a.unlocked) return a;
      let u = false;
      if (a.id === 'firstEnhance' && s.enhanceSuccesses > 0) u = true;
      else if (a.id === 'knight' && rank >= 1) u = true;
      else if (a.id === 'bishop' && rank >= 2) u = true;
      else if (a.id === 'rook' && rank >= 3) u = true;
      else if (a.id === 'queen' && rank >= 4) u = true;
      return { ...a, unlocked: u };
    });
    set({ achievements: newAchs });
  },

  resetDailyMissions: () => {
    const today = getTodayString();
    const s = get();
    if (s.dailyMissionDate !== today) set({ missions: INITIAL_MISSIONS.map(m => ({ ...m })), dailyMissionDate: today });
  },

  saveGame: () => {
    const s = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, handleClick: undefined, actions: undefined }));
  },

  loadGame: () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const d = JSON.parse(saved);
      const stats = calculateStats(d.upgrades || INITIAL_UPGRADES, d.currentPiece || CHESS_PIECES.pawn, d.prestigeBonus || 0);

      // Re-map piece to ensure display name and image are correct for rank
      const pieceTemplate = CHESS_PIECES[d.currentPiece.rank as ChessPieceRank] || CHESS_PIECES.pawn;
      const restoredPiece = { ...pieceTemplate, level: d.currentPiece.level };

      set({ ...d, currentPiece: restoredPiece, ...stats });
    } catch (e) { console.error(e); }
  },
  resetGame: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pony_story_seen'); // 스토리 인트로도 초기화
    window.location.reload();
  }
}));

// ============ UI 컴포넌트 ============
const vibrate = (pattern: number | number[] = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// 애니메이션 텍스트
const FloatingText = ({ x, y, text, type }: { x: number, y: number, text: string, type: 'gold' | 'crit' | 'damage' | 'bonus' }) => {
  const colors = {
    crit: '#ff4757',
    gold: '#f1c40f',
    bonus: '#2ecc71',
    damage: '#fff'
  };
  return (
    <div className="effect-text" style={{
      left: x,
      top: y,
      color: colors[type] || '#fff',
      fontSize: type === 'bonus' ? '2rem' : '1.8rem',
      textShadow: type === 'bonus' ? '0 2px 8px rgba(46, 204, 113, 0.5)' : undefined
    }}>
      {text}
    </div>
  );
};

// 개선된 Crack Effect SVG - 단계별 크랙 패턴
const CrackSVG = ({ damagePercent }: { damagePercent: number }) => {
  // 피해량에 따른 크랙 단계 (0-4)
  const stage = Math.min(4, Math.floor(damagePercent * 5));

  // 기본 불투명도 - 피해에 비례
  const baseOpacity = Math.min(0.9, damagePercent * 1.2);

  // 단계별 크랙 패턴 생성
  const generateCrackPaths = () => {
    const paths: React.ReactNode[] = [];

    // Stage 1: 중앙에서 작은 균열 (20% 이상 피해)
    if (stage >= 1) {
      paths.push(
        <g key="stage1" className="crack-stage-1">
          <path
            d="M50 50 L45 35 L42 25"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 50 L58 38 L62 28"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Stage 2: 가지치기 시작 (40% 이상 피해)
    if (stage >= 2) {
      paths.push(
        <g key="stage2" className="crack-stage-2">
          <path
            d="M45 35 L38 32 L30 35"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M58 38 L65 35 L72 38"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 50 L35 55 L25 52"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Stage 3: 방사형 확장 (60% 이상 피해)
    if (stage >= 3) {
      paths.push(
        <g key="stage3" className="crack-stage-3">
          <path
            d="M50 50 L68 58 L78 55"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 50 L45 68 L40 78"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 50 L60 65 L65 75"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* 추가 분기 */}
          <path
            d="M42 25 L38 18 M42 25 L48 15"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Stage 4: 파괴 직전 - 전면 균열 (80% 이상 피해)
    if (stage >= 4) {
      paths.push(
        <g key="stage4" className="crack-stage-4">
          <path
            d="M25 52 L18 48 L12 52"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M78 55 L85 58 L90 52"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 78 L35 85 M65 75 L70 82"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* 중앙 균열 강조 */}
          <circle
            cx="50" cy="50" r="5"
            fill="none"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          {/* 파편 느낌의 작은 선들 */}
          <path
            d="M30 35 L28 30 M72 38 L76 32 M25 52 L20 55 M78 55 L82 60"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    return paths;
  };

  if (stage === 0) return null;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`crack-svg crack-stage-${stage}`}
      style={{ opacity: baseOpacity }}
    >
      {/* 그림자/깊이 효과 레이어 */}
      <filter id="crack-shadow">
        <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.3)" />
      </filter>

      <g filter="url(#crack-shadow)">
        {generateCrackPaths()}
      </g>

      {/* 파괴 직전 붉은 빛 효과 */}
      {stage >= 4 && (
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="rgba(255,50,50,0.2)"
          strokeWidth="3"
          className="crack-danger-glow"
        />
      )}
    </svg>
  );
};

function StoryIntroModal({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const content = [
    { title: "체스 왕국의 위기", text: "평화롭던 체스 왕국에\n바둑 왕국의 침략이 시작되었다!" },
    { title: "용감한 폰의 등장", text: "작지만 용감한 폰이\n왕국을 지키기 위해 검을 들었다." },
    { title: "강화의 힘", text: "바둑돌을 부수고 골드를 모아\n더 강력한 체스말로 진화하라!" },
    { title: "전설의 시작", text: "지금 바로 모험을 떠나보세요!" }
  ];

  return (
    <div className="story-overlay">
      <div className="story-content">
        <h1>{content[page].title}</h1>
        <p style={{ whiteSpace: 'pre-line' }}>{content[page].text}</p>
      </div>
      <button
        className="story-start-btn"
        onClick={() => {
          if (page < content.length - 1) setPage(p => p + 1);
          else onClose();
        }}
        style={{ marginTop: '30px' }}
      >
        {page < content.length - 1 ? "다음 ▶" : "모험 시작! ⚔️"}
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onPointerUp={onClose}>
      <div className="modal" onPointerUp={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onPointerUp={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// TODO 2: 연령 등급 배지 컴포넌트
function AgeRatingBadge({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="age-rating-overlay" onClick={() => { setVisible(false); onComplete(); }}>
      <div className="age-rating-content">
        <div className="age-rating-badge">
          <span className="age-rating-text">전체이용가</span>
          <span className="age-rating-sub">All Ages</span>
        </div>
        <div className="age-rating-info">
          <p className="info-item"><span>게임명:</span> 바둑돌 부수기</p>
          <p className="info-item"><span>제작사:</span> 체스왕국 스튜디오</p>
          <p className="info-item"><span>등급분류:</span> 전체이용가</p>
          <p className="info-item"><span>내용정보:</span> 폭력성 없음, 선정성 없음</p>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '20px', fontSize: '0.9rem' }}>
        터치하여 건너뛰기
      </p>
    </div>
  );
}

// TODO 1: 종료 확인 모달
function ExitConfirmModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="exit-modal">
        <p className="exit-modal-text">바둑돌 부수기를 종료할까요?</p>
        <div className="exit-modal-buttons">
          <button className="exit-btn cancel" onClick={onCancel}>취소</button>
          <button className="exit-btn confirm" onClick={onConfirm}>종료하기</button>
        </div>
      </div>
    </div>
  );
}

// 더보기 메뉴 모달
function MoreMenuModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const [bgmMuted, setBgmMuted] = useState(soundManager.isBgmMuted());
  const [sfxMuted, setSfxMuted] = useState(soundManager.isSfxMuted());
  const [bgmVolume, setBgmVolume] = useState(soundManager.getBgmVolume());
  const [sfxVolume, setSfxVolume] = useState(soundManager.getSfxVolume());

  const handleBgmToggle = () => {
    const muted = soundManager.toggleBgmMute();
    setBgmMuted(muted);
  };

  const handleSfxToggle = () => {
    const muted = soundManager.toggleSfxMute();
    setSfxMuted(muted);
    if (!muted) soundManager.play('click');
  };

  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setBgmVolume(vol);
    soundManager.setBgmVolume(vol);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSfxVolume(vol);
    soundManager.setSfxVolume(vol);
  };

  return (
    <div className="modal-overlay" onPointerUp={onClose}>
      <div className="more-menu-modal" onPointerUp={e => e.stopPropagation()}>
        <div className="more-menu-header">
          <h3>설정</h3>
          <button className="close-btn" onPointerUp={onClose}>✕</button>
        </div>
        <div className="more-menu-content">
          {/* 사운드 설정 섹션 */}
          <div className="sound-settings-section">
            <h4>🔊 사운드 설정</h4>

            {/* 배경음악 설정 */}
            <div className="sound-setting-item">
              <div className="sound-setting-row">
                <span className="sound-label">🎵 배경음악</span>
                <button
                  className={`sound-toggle-btn ${bgmMuted ? 'muted' : 'active'}`}
                  onPointerUp={handleBgmToggle}
                >
                  {bgmMuted ? 'OFF' : 'ON'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={bgmVolume}
                onChange={handleBgmVolumeChange}
                className="volume-slider"
                disabled={bgmMuted}
              />
              <span className="volume-value">{Math.round(bgmVolume * 100)}%</span>
            </div>

            {/* 효과음 설정 */}
            <div className="sound-setting-item">
              <div className="sound-setting-row">
                <span className="sound-label">🔔 효과음</span>
                <button
                  className={`sound-toggle-btn ${sfxMuted ? 'muted' : 'active'}`}
                  onPointerUp={handleSfxToggle}
                >
                  {sfxMuted ? 'OFF' : 'ON'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={sfxVolume}
                onChange={handleSfxVolumeChange}
                className="volume-slider"
                disabled={sfxMuted}
              />
              <span className="volume-value">{Math.round(sfxVolume * 100)}%</span>
            </div>
          </div>

          {/* 기타 설정 */}
          <div className="other-settings-section">
            <button className="more-menu-item danger" onPointerUp={() => { soundManager.play('click'); onReset(); onClose(); }}>
              <span>🔄</span>
              <span>게임 초기화</span>
            </button>
          </div>

          <div className="more-menu-info">
            <p>바둑돌 부수기 v1.0</p>
            <p>제작: 체스왕국 스튜디오</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 앱
function App() {
  const [showStory, setShowStory] = useState(false);
  const [showAgeRating, setShowAgeRating] = useState(true); // TODO 2: 연령 등급
  const [showExitModal, setShowExitModal] = useState(false); // TODO 1: 종료 확인
  const [showMoreMenu, setShowMoreMenu] = useState(false); // 더보기 메뉴
  const [modalType, setModalType] = useState<'upgrade' | 'shop' | 'mission' | 'auto' | null>(null);
  const [fx, setFx] = useState<{ id: number, x: number, y: number, text: string, type: any }[]>([]);

  const {
    gold, ruby, currentPiece, currentStone, stonesDestroyed,
    attackPower, critChance, autoClicksPerSec,
    stonesUntilBoss, bossesDefeated,
    handleClick, tryEnhance, claimMissionReward, missions,
    loadGame, saveGame, autoTick, collectOfflineReward
  } = useGameStore();

  const [lastEnhanceMsg, setLastEnhanceMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [rewardFx, setRewardFx] = useState<{ id: number; text: string } | null>(null);

  // 강화 아이템 적용 상태
  const [useProtect, setUseProtect] = useState(false);
  const [useBlessing, setUseBlessing] = useState<0 | 1 | 2>(0); // 0: 없음, 1: 축복주문서, 2: 행운주문서

  // 동료 공격 이펙트 상태
  const [autoAttackFx, setAutoAttackFx] = useState<{ id: number; emoji: string; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    loadGame();
    if (!localStorage.getItem('pony_story_seen')) setShowStory(true);

    // Initial Interaction for BGM
    const startAudio = () => {
      soundManager.play('bgm');
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('keydown', startAudio);

    setTimeout(() => {
      const r = collectOfflineReward();
      if (r.gold > 0) alert(`${formatNumber(r.gold)} 골드를 오프라인 수익으로 얻었습니다!`);
    }, 1000);

    const i = setInterval(autoTick, 1000);
    const s = setInterval(saveGame, 10000);

    // 뒤로가기 방지 (앱인토스 가이드라인)
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(i);
      clearInterval(s);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
      soundManager.stopBgm();
    };
  }, []);

  // 동료 자동 공격 시각화 이펙트
  useEffect(() => {
    if (autoClicksPerSec === 0) return;

    const spawnAutoAttackFx = () => {
      const activeClickers = useGameStore.getState().autoClickers.filter(c => c.count > 0);
      if (activeClickers.length === 0) return;

      // 랜덤으로 동료 하나 선택하여 공격 이펙트 생성
      const randomClicker = activeClickers[Math.floor(Math.random() * activeClickers.length)];

      // 화면 좌측에서 바둑돌 방향으로 날아가는 이펙트
      const startX = -20 + Math.random() * 40; // 좌측 시작점
      const startY = 20 + Math.random() * 60; // 랜덤 높이

      const newFx = {
        id: Date.now() + Math.random(),
        emoji: randomClicker.emoji,
        x: startX,
        y: startY,
        delay: Math.random() * 0.3
      };

      setAutoAttackFx(prev => [...prev.slice(-5), newFx]); // 최대 6개 이펙트 유지

      // 이펙트 제거 (애니메이션 후)
      setTimeout(() => {
        setAutoAttackFx(prev => prev.filter(f => f.id !== newFx.id));
      }, 800);
    };

    // 초당 클릭 수에 비례하여 이펙트 생성 (최대 초당 5회)
    const fxPerSecond = Math.min(5, Math.max(1, Math.floor(autoClicksPerSec / 10) + 1));
    const interval = setInterval(spawnAutoAttackFx, 1000 / fxPerSecond);

    return () => clearInterval(interval);
  }, [autoClicksPerSec]);

  // TODO 1: 앱 종료 처리
  const handleExit = () => {
    // 토스 앱인앱에서는 window.close() 또는 토스 SDK의 종료 함수 호출
    window.close();
    // 폴백: 히스토리 뒤로가기
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const onStoryClose = () => {
    localStorage.setItem('pony_story_seen', 'true');
    setShowStory(false);
  };

  const handleAttack = (e: React.PointerEvent) => {
    vibrate(5);
    const result = handleClick();
    soundManager.play('hit');
    if (result.isCrit) soundManager.play('coin');

    setShake(true);
    setTimeout(() => setShake(false), 50);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newFx = {
      id: Date.now(),
      x, y,
      text: result.isCrit ? `💥${formatNumber(result.gold)}!` : `+${formatNumber(result.gold)}`,
      type: result.isCrit ? 'crit' : 'gold'
    };
    setFx(prev => [...prev, newFx]);
    setTimeout(() => setFx(prev => prev.filter(f => f.id !== newFx.id)), 800);

    if (result.destroyed && result.bonusGold > 0) {
      vibrate([30, 50, 30]);
      soundManager.play('destroy');
      soundManager.play('coin');
      const bonusFx = {
        id: Date.now() + 1,
        x: x + 20,
        y: y - 30,
        text: `🎉 +${formatNumber(result.bonusGold)}`,
        type: 'bonus' as const
      };
      setTimeout(() => {
        setFx(prev => [...prev, bonusFx]);
        setTimeout(() => setFx(prev => prev.filter(f => f.id !== bonusFx.id)), 1000);
      }, 200);
    }
  };

  const handleEnhanceClick = () => {
    vibrate(10);
    const res = tryEnhance(useProtect, useBlessing);
    setLastEnhanceMsg(res.message);
    if (res.success) {
      vibrate([50, 100]);
      soundManager.play('success');
    } else if (res.destroyed) {
      vibrate([100, 50, 100]);
      soundManager.play('fail');
    } else {
      soundManager.play('fail');
    }
    setTimeout(() => setLastEnhanceMsg(''), 2000);
  };

  // 상점 아이템 개수 가져오기
  const getItemCount = (itemId: string) => {
    return useGameStore.getState().shopItems.find(i => i.id === itemId)?.count || 0;
  };

  // derived values for stone visualization
  const hpPercent = currentStone.currentHp / currentStone.maxHp;
  const stonePixelSize = STONE_CONFIG[currentStone.size].pixelSize;

  // Helper to render the correct icon
  const renderPieceIcon = (rank: ChessPieceRank, className: string) => {
    const props = { className };
    switch (rank) {
      case 'pawn': return <PawnIcon {...props} />;
      case 'knight': return <KnightIcon {...props} />;
      case 'bishop': return <BishopIcon {...props} />;
      case 'rook': return <RookIcon {...props} />;
      case 'queen': return <QueenIcon {...props} />;
      case 'king': return <KingIcon {...props} />;
      case 'imperial': return <ImperialKingIcon {...props} />;
      default: return <PawnIcon {...props} />;
    }
  };

  // 보스 아이콘 렌더링
  const renderBossIcon = (bossType: BossType, style: React.CSSProperties) => {
    switch (bossType) {
      case 'boss1': return <StoneBossRed style={style} />;
      case 'boss2': return <StoneBossBlue style={style} />;
      case 'boss3': return <StoneBossGreen style={style} />;
      case 'boss4': return <StoneBossPurple style={style} />;
      case 'boss5': return <StoneBossGold style={style} />;
      case 'boss6': return <StoneBossCyan style={style} />;
      case 'boss7': return <StoneBossRainbow style={style} />;
      default: return <StoneBlackIcon style={style} />;
    }
  };

  // 보스 정보
  const currentBossConfig = currentStone.isBoss ? BOSS_CONFIG[currentStone.bossType || 'none'] : null;
  const bossProgress = currentStone.isBoss ? 0 : ((STONES_PER_BOSS - stonesUntilBoss) / STONES_PER_BOSS) * 100;

  return (
    <div className="app">
      {showStory && <StoryIntroModal onClose={onStoryClose} />}

      {/* TODO 2: 연령 등급 배지 (3초 표시) */}
      {showAgeRating && <AgeRatingBadge onComplete={() => setShowAgeRating(false)} />}

      {/* TODO 1: 종료 확인 모달 */}
      {showExitModal && <ExitConfirmModal onCancel={() => setShowExitModal(false)} onConfirm={handleExit} />}

      {/* 더보기 메뉴 모달 */}
      {showMoreMenu && <MoreMenuModal onClose={() => setShowMoreMenu(false)} onReset={() => useGameStore.getState().resetGame()} />}

      {/* Top Header */}
      <div className="game-header">
        <div className="resource-bar">
          <div className="resource-item gold">🪙 {formatNumber(gold)}</div>
          <div className="resource-item ruby">💎 {formatNumber(ruby)}</div>
          <div className="stats-bar">
            <span className="stat-badge">⚔️ {formatNumber(attackPower)}</span>
            {critChance > 0 && <span className="stat-badge">💥 {critChance}%</span>}
            {autoClicksPerSec > 0 && <span className="stat-badge">🤖 {autoClicksPerSec}/s</span>}
          </div>
        </div>
        <div className="nav-buttons">
          <button className="nav-btn more" onPointerUp={() => { soundManager.play('click'); setShowMoreMenu(true); }}>
            <span>⋯</span>
          </button>
          <button className="nav-btn close" onPointerUp={() => { soundManager.play('click'); setShowExitModal(true); }}>
            <span>✕</span>
          </button>
        </div>
      </div>

      {/* 보스 게이지 */}
      <div className="boss-gauge-container">
        {currentStone.isBoss ? (
          <div className="boss-active">
            <span className="boss-icon">{currentBossConfig?.element}</span>
            <span className="boss-name">⚔️ {currentBossConfig?.name} 전투중!</span>
            <span className="boss-count">처치: {bossesDefeated}</span>
          </div>
        ) : (
          <div className="boss-progress">
            <span className="boss-label">다음 보스까지</span>
            <div className="boss-progress-bar">
              <div className="boss-progress-fill" style={{ width: `${bossProgress}%` }} />
            </div>
            <span className="boss-count">{STONES_PER_BOSS - stonesUntilBoss}/{STONES_PER_BOSS}</span>
          </div>
        )}
      </div>

      {/* Main Battle Area */}
      <div className="game-area">

        <div className="battle-container">
          {/* Character */}
          <div className={`character-wrapper ${shake ? 'shake' : ''}`}>
            <div className="weapon-badge">
              {/* 계급장 아이콘만 표시 */}
              {(() => {
                const RankIcon = MILITARY_RANK_ICONS[currentPiece.level];
                return RankIcon ? <RankIcon className="rank-icon" /> : null;
              })()}
              <span className="piece-name">{currentPiece.emoji} {currentPiece.displayName}</span>
            </div>
            {renderPieceIcon(currentPiece.rank, "character-img")}
          </div>

          {/* Target - CSS Rendered Stone / Boss */}
          <div className={`target-wrapper ${shake ? 'shake' : ''} ${currentStone.isBoss ? 'boss-mode' : ''}`} onPointerDown={handleAttack}
            style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* 2D SVG Stone Character / Boss */}
            <div className={`stone-character-wrapper ${currentStone.isBoss ? 'boss' : currentStone.color}`}
              style={{
                width: currentStone.isBoss ? 160 : stonePixelSize,
                height: currentStone.isBoss ? 160 : stonePixelSize,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              {currentStone.isBoss ? (
                renderBossIcon(currentStone.bossType || 'none', { width: '100%', height: '100%' })
              ) : currentStone.color === 'black' ? (
                <StoneBlackIcon style={{ width: '100%', height: '100%' }} />
              ) : (
                <StoneWhiteIcon style={{ width: '100%', height: '100%' }} />
              )}

              {/* Crack Overlay (SVG) - Rendered ON TOP of the stone SVG */}
              {!currentStone.isBoss && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <CrackSVG damagePercent={1 - hpPercent} />
                </div>
              )}
            </div>

            {/* HP Bar */}
            <div className={`hp-bar-container ${currentStone.isBoss ? 'boss-hp' : ''}`} style={{ position: 'absolute', bottom: -20 }}>
              <div
                className={`hp-bar-fill ${currentStone.isBoss ? 'boss-hp-fill' : ''}`}
                style={{ width: `${hpPercent * 100}%` }}
              />
            </div>

            {/* 보스 이름 표시 */}
            {currentStone.isBoss && currentBossConfig && (
              <div className="boss-name-tag">
                {currentBossConfig.element} {currentBossConfig.name}
              </div>
            )}
          </div>

          {/* FX Layer */}
          {fx.map(f => <FloatingText key={f.id} x={f.x} y={f.y} text={f.text} type={f.type} />)}

          {/* Auto Attack FX Layer - 동료 공격 이펙트 */}
          {autoAttackFx.map(f => (
            <div
              key={f.id}
              className="auto-attack-fx"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                animationDelay: `${f.delay}s`
              }}
            >
              {f.emoji}
            </div>
          ))}
        </div>

        {/* Stats Mini */}
        <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', marginTop: '10px' }}>
          파괴한 바둑돌: {stonesDestroyed}
        </div>

      </div>

      {/* Bottom Controls */}
      <div className="bottom-controls">

        {/* Enhance Button Group with Item Options */}
        <div className="enhance-group">
          <h3 style={{ color: '#2f3542', marginBottom: '8px', textShadow: 'none' }}>체스말 강화</h3>

          {/* 보유 아이템 표시 & 적용 토글 */}
          <div className="enhance-items">
            <button
              className={`enhance-item-toggle ${useProtect ? 'active' : ''} ${!useProtect && getItemCount('protectScroll') === 0 ? 'disabled' : ''}`}
              onPointerUp={() => {
                // 이미 선택된 상태면 해제 가능, 선택 안 된 상태면 아이템 있어야 선택 가능
                if (useProtect || getItemCount('protectScroll') > 0) {
                  setUseProtect(!useProtect);
                }
              }}
            >
              <span className="item-emoji">🛡️</span>
              <span className="item-name">파괴방지</span>
              <span className="item-count">x{getItemCount('protectScroll')}</span>
            </button>

            <button
              className={`enhance-item-toggle ${useBlessing === 1 ? 'active' : ''} ${useBlessing !== 1 && getItemCount('blessScroll') === 0 ? 'disabled' : ''}`}
              onPointerUp={() => {
                // 이미 선택된 상태면 해제 가능, 선택 안 된 상태면 아이템 있어야 선택 가능
                if (useBlessing === 1 || getItemCount('blessScroll') > 0) {
                  setUseBlessing(useBlessing === 1 ? 0 : 1);
                }
              }}
            >
              <span className="item-emoji">✨</span>
              <span className="item-name">축복 +10%</span>
              <span className="item-count">x{getItemCount('blessScroll')}</span>
            </button>

            <button
              className={`enhance-item-toggle ${useBlessing === 2 ? 'active' : ''} ${useBlessing !== 2 && getItemCount('luckyScroll') === 0 ? 'disabled' : ''}`}
              onPointerUp={() => {
                // 이미 선택된 상태면 해제 가능, 선택 안 된 상태면 아이템 있어야 선택 가능
                if (useBlessing === 2 || getItemCount('luckyScroll') > 0) {
                  setUseBlessing(useBlessing === 2 ? 0 : 2);
                }
              }}
            >
              <span className="item-emoji">🍀</span>
              <span className="item-name">행운 +20%</span>
              <span className="item-count">x{getItemCount('luckyScroll')}</span>
            </button>
          </div>

          <button className="enhance-btn" onPointerUp={handleEnhanceClick}>
            <div className="enhance-content">
              <span className="enhance-main-text">강화하기</span>
              <span className="enhance-cost">💰 {formatNumber(ENHANCE_RATES[currentPiece.level]?.cost || 0)}</span>
            </div>
            <div className="enhance-info">
              <span className="prob success">
                {Math.min(100, (ENHANCE_RATES[currentPiece.level]?.successRate || 0) + (useBlessing === 1 ? 10 : useBlessing === 2 ? 20 : 0))}% 성공
              </span>
              <span className="prob destroy">
                {useProtect ? '0%' : `${ENHANCE_RATES[currentPiece.level]?.destroyRate || 0}%`} 파괴
              </span>
            </div>
            {lastEnhanceMsg && <div className="enhance-msg-overlay">{lastEnhanceMsg}</div>}
          </button>
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          <button className="menu-item-btn" onPointerUp={() => { soundManager.play('click'); setModalType('upgrade'); }}>
            <span>📈</span><span>성장</span>
          </button>
          <button className="menu-item-btn" onPointerUp={() => { soundManager.play('click'); setModalType('auto'); }}>
            <span>🐾</span><span>동료</span>
          </button>
          <button className="menu-item-btn" onPointerUp={() => { soundManager.play('click'); setModalType('shop'); }}>
            <span>🛒</span><span>상점</span>
          </button>
          <button className="menu-item-btn" onPointerUp={() => { soundManager.play('click'); setModalType('mission'); }}>
            <span>📜</span><span>미션</span>
          </button>
        </div>

      </div>

      {/* Modals */}
      {modalType === 'upgrade' && (
        <Modal title="스탯 성장" onClose={() => setModalType(null)}>
          {useGameStore.getState().upgrades.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', background: '#f1f2f6', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{u.name} Lv.{u.level}</div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>현재 효과: {Math.floor(u.baseValue + u.increment * u.level)}</div>
              </div>
              <button
                style={{ background: gold >= getUpgradeCost(u) ? '#2ecc71' : '#bdc3c7', border: 'none', padding: '12px 18px', borderRadius: '8px', color: 'white', fontWeight: 'bold', minHeight: '44px' }}
                onPointerUp={(e) => { e.stopPropagation(); vibrate(5); soundManager.play('success'); useGameStore.getState().upgradestat(u.id); }}
              >
                💰 {formatNumber(getUpgradeCost(u))}
              </button>
            </div>
          ))}
        </Modal>
      )}

      {modalType === 'auto' && (
        <Modal title="동료 모집" onClose={() => setModalType(null)}>
          {useGameStore.getState().autoClickers.map(ac => (
            <div key={ac.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', background: '#f1f2f6', padding: '10px', borderRadius: '10px' }}>
              <div style={{ fontSize: '2rem', marginRight: '10px' }}>{ac.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{ac.name} <span style={{ fontSize: '0.8rem', color: '#e67e22' }}>x{ac.count}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>DPS: +{ac.clicksPerSec}</div>
              </div>
              <button
                style={{ background: gold >= getAutoClickerCost(ac) ? '#9b59b6' : '#bdc3c7', border: 'none', padding: '12px 18px', borderRadius: '8px', color: 'white', fontWeight: 'bold', minHeight: '44px' }}
                onPointerUp={(e) => { e.stopPropagation(); vibrate(5); soundManager.play('coin'); useGameStore.getState().buyAutoClicker(ac.id); }}
              >
                💰 {formatNumber(getAutoClickerCost(ac))}
              </button>
            </div>
          ))}
        </Modal>
      )}

      {modalType === 'shop' && (
        <Modal title="상점" onClose={() => setModalType(null)}>
          {useGameStore.getState().shopItems.map(item => {
            const canBuy = (item.goldCost > 0 && gold >= item.goldCost) || (item.rubyCost > 0 && ruby >= item.rubyCost);
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', background: '#f1f2f6', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '2rem', marginRight: '10px' }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{item.name} <span style={{ color: '#e67e22', fontSize: '0.85rem' }}>x{item.count}</span></div>
                  <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{item.description}</div>
                </div>
                <button
                  style={{ background: canBuy ? '#3498db' : '#bdc3c7', border: 'none', padding: '12px 15px', borderRadius: '8px', color: 'white', fontWeight: 'bold', minHeight: '44px' }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    const success = useGameStore.getState().buyShopItem(item.id);
                    if (success) {
                      vibrate([30, 30]);
                      soundManager.play('success');
                      setRewardFx({ id: Date.now(), text: `✅ ${item.name} 구매 완료!` });
                      setTimeout(() => setRewardFx(null), 1500);
                    } else {
                      vibrate(10);
                    }
                  }}
                >
                  {item.rubyCost > 0 ? `💎 ${item.rubyCost}` : `💰 ${formatNumber(item.goldCost)}`}
                </button>
              </div>
            );
          })}
        </Modal>
      )}

      {modalType === 'mission' && (
        <Modal title="미션 & 업적" onClose={() => setModalType(null)}>
          <h3 style={{ marginBottom: '15px', color: '#2f3542' }}>📋 일일 미션</h3>
          {missions.map(m => {
            const progress = Math.min(100, (m.current / m.target) * 100);
            return (
              <div key={m.id} className={`mission-item ${m.completed ? 'completed' : ''} ${m.claimed ? 'claimed' : ''}`}>
                <div className="mission-header">
                  <span className="mission-name">{m.name}</span>
                  <span className="mission-progress">{m.current}/{m.target}</span>
                </div>
                <div className="mission-progress-bar">
                  <div className="mission-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="mission-reward">
                    {m.reward.gold > 0 && <span>🪙 {formatNumber(m.reward.gold)}</span>}
                    {m.reward.ruby > 0 && <span>💎 {m.reward.ruby}</span>}
                  </div>
                  {m.completed && !m.claimed && (
                    <button
                      className="claim-btn"
                      onPointerUp={(e) => {
                        e.stopPropagation();
                        const success = claimMissionReward(m.id);
                        if (success) {
                          vibrate([50, 50, 50]);
                          soundManager.play('success');
                          setRewardFx({
                            id: Date.now(),
                            text: `🎁 ${m.reward.gold > 0 ? `+${formatNumber(m.reward.gold)} 골드` : ''} ${m.reward.ruby > 0 ? `+${m.reward.ruby} 루비` : ''}`
                          });
                          setTimeout(() => setRewardFx(null), 2000);
                        }
                      }}
                    >
                      보상받기
                    </button>
                  )}
                  {m.claimed && <span style={{ color: '#95a5a6', fontWeight: 'bold' }}>✓ 완료</span>}
                </div>
              </div>
            );
          })}
        </Modal>
      )}

      {/* Reward Toast */}
      {rewardFx && (
        <div className="reward-toast">{rewardFx.text}</div>
      )}

    </div>
  );
}

export default App;
