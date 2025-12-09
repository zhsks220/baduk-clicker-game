import { useState, useEffect } from 'react';
import { create } from 'zustand';
import './App.css';

// Assets (2D Characters)
// King is missing due to quota, reusing Queen for now (logic handles this)
// SVG Components
import { PawnIcon, KnightIcon, BishopIcon, RookIcon, QueenIcon, KingIcon } from './components/ChessIcons';
import { StoneBlackIcon, StoneWhiteIcon } from './components/StoneIcons';

// ============ 타입 정의 ============
type ChessPieceRank = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' | 'imperial';
type StoneColor = 'black' | 'white';
type StoneSize = 'small' | 'medium' | 'large';

interface GoStone {
  color: StoneColor;
  size: StoneSize;
  maxHp: number;
  currentHp: number;
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
  imperial: { rank: 'imperial', displayName: '황제신왕', emoji: '👑' }, // Placeholder: Queen
};

const RANK_ORDER: ChessPieceRank[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'imperial'];

const ENHANCE_RATES = [
  { level: 0, successRate: 100, cost: 50, destroyRate: 0 },
  { level: 1, successRate: 90, cost: 100, destroyRate: 0 },
  { level: 2, successRate: 80, cost: 200, destroyRate: 0 },
  { level: 3, successRate: 70, cost: 500, destroyRate: 5 },
  { level: 4, successRate: 60, cost: 1000, destroyRate: 10 },
  { level: 5, successRate: 50, cost: 2000, destroyRate: 15 },
  { level: 6, successRate: 40, cost: 5000, destroyRate: 20 },
  { level: 7, successRate: 30, cost: 10000, destroyRate: 25 },
  { level: 8, successRate: 20, cost: 25000, destroyRate: 30 },
  { level: 9, successRate: 10, cost: 50000, destroyRate: 40 },
  { level: 10, successRate: 5, cost: 100000, destroyRate: 0 },
];

const INITIAL_UPGRADES: UpgradeStat[] = [
  { id: 'goldPerClick', name: '클릭당 골드', level: 1, baseValue: 1, increment: 1, baseCost: 10, costMultiplier: 1.15 },
  { id: 'attackPower', name: '공격력', level: 1, baseValue: 1, increment: 1, baseCost: 15, costMultiplier: 1.18 },
  { id: 'critChance', name: '치명타 확률', level: 0, baseValue: 0, increment: 5, baseCost: 50, costMultiplier: 1.25 },
  { id: 'critDamage', name: '치명타 데미지', level: 0, baseValue: 150, increment: 10, baseCost: 80, costMultiplier: 1.2 },
];

const INITIAL_AUTO_CLICKERS: AutoClicker[] = [
  { id: 'finger', name: '보조 손가락', emoji: '👆', clicksPerSec: 1, baseCost: 100, count: 0 },
  { id: 'fan', name: '부채', emoji: '🪭', clicksPerSec: 3, baseCost: 500, count: 0 },
  { id: 'sword', name: '검', emoji: '⚔️', clicksPerSec: 10, baseCost: 2000, count: 0 },
  { id: 'magic', name: '마법봉', emoji: '🪄', clicksPerSec: 25, baseCost: 8000, count: 0 },
  { id: 'dragon', name: '드래곤', emoji: '🐉', clicksPerSec: 100, baseCost: 50000, count: 0 },
];

const INITIAL_SHOP_ITEMS: ShopItem[] = [
  { id: 'protectScroll', name: '파괴방지권', emoji: '🛡️', description: '강화 실패 방지', goldCost: 0, rubyCost: 10, count: 0 },
  { id: 'blessScroll', name: '축복주문서', emoji: '✨', description: '확률 +10%', goldCost: 0, rubyCost: 15, count: 0 },
  { id: 'luckyScroll', name: '행운주문서', emoji: '🍀', description: '확률 +20%', goldCost: 0, rubyCost: 25, count: 0 },
  { id: 'goldBoost', name: '골드 부스터', emoji: '💎', description: '5분간 골드 2배', goldCost: 5000, rubyCost: 0, count: 0 },
  { id: 'autoBoost', name: '자동 부스터', emoji: '⚡', description: '5분간 자동 2배', goldCost: 10000, rubyCost: 0, count: 0 },
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

// 바둑돌 설정 (Stone Styles for CSS)
const STONE_CONFIG: Record<StoneSize, { hpMultiplier: number; pixelSize: number }> = {
  small: { hpMultiplier: 1, pixelSize: 80 },
  medium: { hpMultiplier: 2, pixelSize: 110 },
  large: { hpMultiplier: 4, pixelSize: 150 },
};

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
  return Math.floor(clicker.baseCost * Math.pow(1.15, clicker.count));
};

// ============ Zustand 스토어 ============
interface GameState {
  gold: number;
  ruby: number;
  totalGold: number;
  totalClicks: number;
  currentStone: GoStone;
  stonesDestroyed: number;
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

const calculateStats = (upgrades: UpgradeStat[], piece: ChessPiece, prestigeBonus: number) => {
  const rankBonus = RANK_ORDER.indexOf(piece.rank) + 1;
  const levelBonus = 1 + piece.level * 0.1;
  const prestige = 1 + prestigeBonus;

  const goldUpgrade = upgrades.find(u => u.id === 'goldPerClick')!;
  const attackUpgrade = upgrades.find(u => u.id === 'attackPower')!;
  const critChanceUpgrade = upgrades.find(u => u.id === 'critChance')!;
  const critDamageUpgrade = upgrades.find(u => u.id === 'critDamage')!;

  return {
    goldPerClick: Math.floor((goldUpgrade.baseValue + goldUpgrade.increment * (goldUpgrade.level - 1)) * rankBonus * levelBonus * prestige),
    attackPower: Math.floor((attackUpgrade.baseValue + attackUpgrade.increment * (attackUpgrade.level - 1)) * rankBonus * levelBonus),
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
    const damage = state.attackPower; // Damage to stone HP
    const newHp = Math.max(0, state.currentStone.currentHp - damage);
    const destroyed = newHp <= 0;

    let bonusGold = 0;
    if (destroyed) {
      const totalStoneGold = state.currentStone.maxHp * baseGold * 0.1; // Gold reward scaling
      const bonusPercent = [33, 66, 99][Math.floor(Math.random() * 3)];
      bonusGold = Math.floor(totalStoneGold * bonusPercent / 100);
    }
    const totalGoldEarned = earnedGold + bonusGold;

    if (destroyed) {
      set(s => ({
        gold: s.gold + totalGoldEarned,
        totalGold: s.totalGold + totalGoldEarned,
        totalClicks: s.totalClicks + 1,
        currentStone: createRandomStone(s.attackPower),
        stonesDestroyed: s.stonesDestroyed + 1,
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
      if (newLevel > 10) {
        // Rank Up Logic
        const currentRankIndex = RANK_ORDER.indexOf(state.currentPiece.rank);
        const nextRank = RANK_ORDER[currentRankIndex + 1] || 'imperial';
        const newPiece = { ...CHESS_PIECES[nextRank], level: 0 };
        const newStats = calculateStats(state.upgrades, newPiece, state.prestigeBonus);
        set(s => ({ currentPiece: newPiece, enhanceSuccesses: s.enhanceSuccesses + 1, ...newStats }));
        get().checkAchievements();
        return { success: true, destroyed: false, message: `승급 성공! ${newPiece.displayName}` };
      }
      const newPiece = { ...state.currentPiece, level: newLevel };
      const newStats = calculateStats(state.upgrades, newPiece, state.prestigeBonus);
      set(s => ({ currentPiece: newPiece, enhanceSuccesses: s.enhanceSuccesses + 1, ...newStats }));
      get().checkMissions();
      get().checkAchievements();
      return { success: true, destroyed: false, message: `강화 성공! +${newLevel}` };
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

    // 자동 클릭 횟수 (초당 클릭 수 * 부스터)
    const autoClicks = state.autoClicksPerSec * autoMultiplier;

    // 총 데미지 계산
    const totalDamage = state.attackPower * autoClicks;
    const totalGoldEarned = Math.floor(state.goldPerClick * autoClicks * goldMultiplier);

    // 바둑돌 HP 감소
    let newHp = state.currentStone.currentHp - totalDamage;
    let newStone = state.currentStone;
    let destroyed = 0;
    let bonusGold = 0;

    // 바둑돌이 파괴되면 새 돌 생성 (연속 파괴 가능)
    while (newHp <= 0) {
      destroyed++;
      // 파괴 보너스 골드
      const stoneBonus = Math.floor(state.currentStone.maxHp * state.goldPerClick * 0.1);
      bonusGold += stoneBonus;

      // 새 바둑돌 생성
      newStone = createRandomStone(state.attackPower);
      newHp = newStone.currentHp + newHp; // 남은 데미지 적용
    }

    // 상태 업데이트
    set(s => ({
      gold: s.gold + totalGoldEarned + bonusGold,
      totalGold: s.totalGold + totalGoldEarned + bonusGold,
      currentStone: { ...newStone, currentHp: Math.max(0, newHp) },
      stonesDestroyed: s.stonesDestroyed + destroyed,
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
  return (
    <div className="modal-overlay" onPointerUp={onClose}>
      <div className="more-menu-modal" onPointerUp={e => e.stopPropagation()}>
        <div className="more-menu-header">
          <h3>설정</h3>
          <button className="close-btn" onPointerUp={onClose}>✕</button>
        </div>
        <div className="more-menu-content">
          <button className="more-menu-item" onPointerUp={() => { onReset(); onClose(); }}>
            <span>🔄</span>
            <span>게임 초기화</span>
          </button>
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
    if (res.success) vibrate([50, 100]);
    else if (res.destroyed) vibrate([100, 50, 100]);
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
      case 'imperial': return <KingIcon {...props} />; // Reuse King for now or add new
      default: return <PawnIcon {...props} />;
    }
  };

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
          <button className="nav-btn more" onPointerUp={() => setShowMoreMenu(true)}>
            <span>⋯</span>
          </button>
          <button className="nav-btn close" onPointerUp={() => setShowExitModal(true)}>
            <span>✕</span>
          </button>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="game-area">

        <div className="battle-container">
          {/* Character */}
          <div className={`character-wrapper ${shake ? 'shake' : ''}`}>
            <div className="weapon-badge">{currentPiece.emoji} {currentPiece.displayName} +{currentPiece.level}</div>
            {renderPieceIcon(currentPiece.rank, "character-img")}
          </div>

          {/* Target - CSS Rendered Stone */}
          <div className={`target-wrapper ${shake ? 'shake' : ''}`} onPointerDown={handleAttack}
            style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* 2D SVG Stone Character */}
            <div className={`stone-character-wrapper ${currentStone.color}`}
              style={{
                width: stonePixelSize,
                height: stonePixelSize,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              {currentStone.color === 'black' ? (
                <StoneBlackIcon style={{ width: '100%', height: '100%' }} />
              ) : (
                <StoneWhiteIcon style={{ width: '100%', height: '100%' }} />
              )}

              {/* Crack Overlay (SVG) - Rendered ON TOP of the stone SVG */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <CrackSVG damagePercent={1 - hpPercent} />
              </div>
            </div>

            {/* HP Bar */}
            <div className="hp-bar-container" style={{ position: 'absolute', bottom: -20 }}>
              <div
                className="hp-bar-fill"
                style={{ width: `${hpPercent * 100}%` }}
              />
            </div>
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
          <button className="menu-item-btn" onPointerUp={() => setModalType('upgrade')}>
            <span>📈</span><span>성장</span>
          </button>
          <button className="menu-item-btn" onPointerUp={() => setModalType('auto')}>
            <span>🐾</span><span>동료</span>
          </button>
          <button className="menu-item-btn" onPointerUp={() => setModalType('shop')}>
            <span>🛒</span><span>상점</span>
          </button>
          <button className="menu-item-btn" onPointerUp={() => setModalType('mission')}>
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
                onPointerUp={(e) => { e.stopPropagation(); vibrate(5); useGameStore.getState().upgradestat(u.id); }}
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
                onPointerUp={(e) => { e.stopPropagation(); vibrate(5); useGameStore.getState().buyAutoClicker(ac.id); }}
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
