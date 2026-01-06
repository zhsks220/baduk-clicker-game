// ============ 게임 상수 복사 ============
const RANK_ORDER = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'imperial'];

const RANK_MULTIPLIERS = {
  pawn: 1, knight: 2, bishop: 3, rook: 5, queen: 8, king: 12, imperial: 20
};

const ENHANCE_RATES = [
  { level: 0, name: '이병', successRate: 100, cost: 100, destroyRate: 0 },
  { level: 1, name: '일병', successRate: 99, cost: 300, destroyRate: 0 },
  { level: 2, name: '상병', successRate: 98, cost: 800, destroyRate: 0 },
  { level: 3, name: '병장', successRate: 97, cost: 2000, destroyRate: 0 },
  { level: 4, name: '하사', successRate: 96, cost: 5000, destroyRate: 3 },
  { level: 5, name: '중사', successRate: 94, cost: 12000, destroyRate: 3.5 },
  { level: 6, name: '상사', successRate: 92, cost: 30000, destroyRate: 4 },
  { level: 7, name: '소위', successRate: 90, cost: 70000, destroyRate: 4.5 },
  { level: 8, name: '중위', successRate: 88, cost: 150000, destroyRate: 5 },
  { level: 9, name: '대위', successRate: 85, cost: 350000, destroyRate: 6 },
  { level: 10, name: '소령', successRate: 82, cost: 800000, destroyRate: 7 },
  { level: 11, name: '중령', successRate: 78, cost: 1800000, destroyRate: 8 },
  { level: 12, name: '대령', successRate: 74, cost: 4000000, destroyRate: 8.5 },
  { level: 13, name: '준장', successRate: 69, cost: 9000000, destroyRate: 9 },
  { level: 14, name: '소장', successRate: 64, cost: 20000000, destroyRate: 9.5 },
  { level: 15, name: '중장', successRate: 58, cost: 45000000, destroyRate: 10 },
  { level: 16, name: '대장', successRate: 50, cost: 100000000, destroyRate: 10.5 },
];

const RANK_ENHANCE_MULTIPLIERS = {
  pawn: { costMultiplier: 1, successRateBonus: 0, destroyRateBonus: 0 },
  knight: { costMultiplier: 20, successRateBonus: -12, destroyRateBonus: 2 },
  bishop: { costMultiplier: 110, successRateBonus: -25, destroyRateBonus: 4 },
  rook: { costMultiplier: 550, successRateBonus: -32, destroyRateBonus: 7 },
  queen: { costMultiplier: 2200, successRateBonus: -38, destroyRateBonus: 12 },
  king: { costMultiplier: 5500, successRateBonus: -45, destroyRateBonus: 20 },
  imperial: { costMultiplier: 1, successRateBonus: 0, destroyRateBonus: 0 },
};

// 도구 데이터
const AUTO_CLICKERS = [
  { id: 'hammer', clicksPerSec: 0.5, baseCost: 300, unlockRank: 'pawn', unlockLevel: 0 },
  { id: 'pickaxe', clicksPerSec: 1, baseCost: 1800, unlockRank: 'pawn', unlockLevel: 4 },
  { id: 'mace', clicksPerSec: 3, baseCost: 9000, unlockRank: 'knight', unlockLevel: 0 },
  { id: 'drill', clicksPerSec: 8, baseCost: 48000, unlockRank: 'bishop', unlockLevel: 0 },
  { id: 'dynamite', clicksPerSec: 20, baseCost: 250000, unlockRank: 'rook', unlockLevel: 0 },
  { id: 'laser', clicksPerSec: 50, baseCost: 1200000, unlockRank: 'queen', unlockLevel: 0 },
  { id: 'blackhole', clicksPerSec: 120, baseCost: 6000000, unlockRank: 'king', unlockLevel: 0 },
];

const STONE_BASE_HP = 150;
const STONE_HP_GROWTH_RATE = 0.004;

const RANK_HP_REDUCTION = {
  pawn: 0.002, knight: 0.003, bishop: 0.005, rook: 0.007, queen: 0.008, king: 0.010, imperial: 0
};

// ============ 시뮬레이션 함수 ============
function getEnhanceCost(rank, level) {
  return Math.floor(ENHANCE_RATES[level].cost * RANK_ENHANCE_MULTIPLIERS[rank].costMultiplier);
}

function getSuccessRate(rank, level) {
  return Math.max(10, ENHANCE_RATES[level].successRate + RANK_ENHANCE_MULTIPLIERS[rank].successRateBonus);
}

function getDestroyRate(rank, level) {
  if (level < 4) return 0;
  return ENHANCE_RATES[level].destroyRate + RANK_ENHANCE_MULTIPLIERS[rank].destroyRateBonus;
}

function calculateStoneHp(stonesDestroyed, rankIndex, level) {
  const growthMultiplier = Math.pow(1 + STONE_HP_GROWTH_RATE, stonesDestroyed);

  let totalReduction = 0;
  for (let i = 0; i < rankIndex; i++) {
    totalReduction += 17 * RANK_HP_REDUCTION[RANK_ORDER[i]];
  }
  totalReduction += level * RANK_HP_REDUCTION[RANK_ORDER[rankIndex]];

  if (rankIndex >= 6) totalReduction = 0.90;

  const reductionMultiplier = Math.max(0.1, 1 - totalReduction);
  return Math.max(10, Math.floor(STONE_BASE_HP * growthMultiplier * reductionMultiplier));
}

function getAutoClickerCost(baseCost, count) {
  return Math.floor(baseCost * Math.pow(1.50, count));
}

function formatNum(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + '조';
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '억';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '만';
  return n.toLocaleString();
}

// ============ 메인 시뮬레이션 ============
function simulate(clicksPerSecond = 3, hoursPerDay = 4, verbose = false) {
  let gold = 0;
  let totalGold = 0;
  let rankIndex = 0;
  let level = 0;
  let stonesDestroyed = 0;
  let totalSeconds = 0;
  let goldPerClick = 1;
  let attackPower = 1;
  let autoClicksPerSec = 0;
  let toolCounts = [0, 0, 0, 0, 0, 0, 0];
  let upgradeLevel = { gold: 1, attack: 1 };

  let enhanceAttempts = 0;
  let enhanceSuccesses = 0;
  let destroys = 0;
  let goldSpentOnEnhance = 0;
  let goldSpentOnTools = 0;
  let goldSpentOnUpgrades = 0;

  const secondsPerDay = hoursPerDay * 3600;
  let lastDay = 0;

  while (rankIndex < 6 || (rankIndex === 6 && level < 1)) {
    // 10초 단위로 시뮬레이션 (속도 향상)
    const deltaTime = 10;
    const totalClicks = (clicksPerSecond + autoClicksPerSec) * deltaTime;
    const stoneHp = calculateStoneHp(Math.floor(stonesDestroyed), rankIndex, level);

    // 골드 획득
    const clickGold = totalClicks * goldPerClick;
    const stonesThisTick = Math.max(0.1, (totalClicks * attackPower) / stoneHp);
    const destroyBonus = stonesThisTick * stoneHp * goldPerClick * 0.1 * 0.66;
    const goldThisTick = clickGold + destroyBonus;

    gold += goldThisTick;
    totalGold += goldThisTick;
    stonesDestroyed += stonesThisTick;
    totalSeconds += deltaTime;

    // 업그레이드 구매
    for (let i = 0; i < 5; i++) {
      const goldUpgradeCost = Math.floor(50 * Math.pow(1.08, upgradeLevel.gold));
      if (gold >= goldUpgradeCost && upgradeLevel.gold < 1000) {
        gold -= goldUpgradeCost;
        goldSpentOnUpgrades += goldUpgradeCost;
        upgradeLevel.gold++;
        goldPerClick = 1 + upgradeLevel.gold;
      }

      const attackUpgradeCost = Math.floor(100 * Math.pow(1.20, upgradeLevel.attack));
      if (gold >= attackUpgradeCost && upgradeLevel.attack < 1000) {
        gold -= attackUpgradeCost;
        goldSpentOnUpgrades += attackUpgradeCost;
        upgradeLevel.attack++;
        attackPower = (1 + upgradeLevel.attack) * RANK_MULTIPLIERS[RANK_ORDER[rankIndex]] * (1 + level * 0.1);
      }
    }

    // 도구 구매
    for (let i = 0; i < AUTO_CLICKERS.length; i++) {
      const tool = AUTO_CLICKERS[i];
      const toolRankIndex = RANK_ORDER.indexOf(tool.unlockRank);
      if (rankIndex > toolRankIndex || (rankIndex === toolRankIndex && level >= tool.unlockLevel)) {
        const cost = getAutoClickerCost(tool.baseCost, toolCounts[i]);
        if (gold >= cost && toolCounts[i] < 50) {
          gold -= cost;
          goldSpentOnTools += cost;
          toolCounts[i]++;
          autoClicksPerSec = toolCounts.reduce((sum, c, idx) => sum + c * AUTO_CLICKERS[idx].clicksPerSec, 0);
        }
      }
    }

    // 강화 시도
    if (level < 17) {
      const enhanceCost = getEnhanceCost(RANK_ORDER[rankIndex], level);
      while (gold >= enhanceCost * 2 && level < 17) {
        gold -= enhanceCost;
        goldSpentOnEnhance += enhanceCost;
        enhanceAttempts++;

        const successRate = getSuccessRate(RANK_ORDER[rankIndex], level);
        const destroyRate = getDestroyRate(RANK_ORDER[rankIndex], level);

        const roll = Math.random() * 100;
        if (roll < successRate) {
          level++;
          enhanceSuccesses++;
          attackPower = (1 + upgradeLevel.attack) * RANK_MULTIPLIERS[RANK_ORDER[rankIndex]] * (1 + level * 0.1);

          if (level >= 17 && rankIndex < 6) {
            if (verbose) {
              const days = totalSeconds / secondsPerDay;
              console.log(`[${days.toFixed(1)}일] ${RANK_ORDER[rankIndex]} 대장 달성! -> ${RANK_ORDER[rankIndex + 1]} 진화`);
            }
            rankIndex++;
            level = 0;
            attackPower = (1 + upgradeLevel.attack) * RANK_MULTIPLIERS[RANK_ORDER[rankIndex]];
          }
          break;
        } else if (roll < successRate + destroyRate) {
          level = 0;
          destroys++;
          attackPower = (1 + upgradeLevel.attack) * RANK_MULTIPLIERS[RANK_ORDER[rankIndex]];
          break;
        }
      }
    }

    // 일별 로그
    const currentDay = Math.floor(totalSeconds / secondsPerDay);
    if (verbose && currentDay > lastDay) {
      lastDay = currentDay;
      console.log(`[${currentDay}일차] ${RANK_ORDER[rankIndex]} ${ENHANCE_RATES[level]?.name || '대장'} | 골드: ${formatNum(gold)} | 공격력: ${formatNum(Math.floor(attackPower))} | 자동: ${autoClicksPerSec.toFixed(1)}/s`);
    }

    // 200일 제한
    if (totalSeconds > 200 * secondsPerDay) break;
  }

  const days = totalSeconds / secondsPerDay;
  return {
    days,
    enhanceAttempts,
    enhanceSuccesses,
    destroys,
    stonesDestroyed: Math.floor(stonesDestroyed),
    totalGold,
    goldSpentOnEnhance,
    goldSpentOnTools,
    goldSpentOnUpgrades
  };
}

// ============ 시뮬레이션 실행 ============
console.log('=== 임페리얼 킹 도달 시뮬레이션 ===\n');

// 상세 로그 1회 실행
console.log('--- 샘플 플레이 (하루 4시간) ---');
const sample = simulate(3, 4, true);
console.log(`\n완료! ${sample.days.toFixed(1)}일 소요\n`);

// 통계용 100회 실행
console.log('--- 100회 시뮬레이션 통계 ---\n');

const results4h = [];
for (let i = 0; i < 100; i++) {
  results4h.push(simulate(3, 4, false));
}

const avg4h = results4h.reduce((s, r) => s + r.days, 0) / results4h.length;
const min4h = Math.min(...results4h.map(r => r.days));
const max4h = Math.max(...results4h.map(r => r.days));
const avgAttempts = results4h.reduce((s, r) => s + r.enhanceAttempts, 0) / results4h.length;
const avgDestroys = results4h.reduce((s, r) => s + r.destroys, 0) / results4h.length;
const avgStones = results4h.reduce((s, r) => s + r.stonesDestroyed, 0) / results4h.length;
const avgTotalGold = results4h.reduce((s, r) => s + r.totalGold, 0) / results4h.length;

console.log('[하루 4시간 플레이]');
console.log(`  평균: ${avg4h.toFixed(1)}일`);
console.log(`  최소: ${min4h.toFixed(1)}일 / 최대: ${max4h.toFixed(1)}일`);
console.log(`  평균 강화 시도: ${Math.floor(avgAttempts).toLocaleString()}회`);
console.log(`  평균 파괴 횟수: ${Math.floor(avgDestroys).toLocaleString()}회`);
console.log(`  평균 바둑돌 파괴: ${formatNum(Math.floor(avgStones))}개`);
console.log(`  평균 총 골드 획득: ${formatNum(Math.floor(avgTotalGold))}`);

// 8시간 플레이
const results8h = [];
for (let i = 0; i < 100; i++) {
  results8h.push(simulate(3, 8, false));
}
const avg8h = results8h.reduce((s, r) => s + r.days, 0) / results8h.length;
const min8h = Math.min(...results8h.map(r => r.days));
const max8h = Math.max(...results8h.map(r => r.days));

console.log('\n[하루 8시간 플레이]');
console.log(`  평균: ${avg8h.toFixed(1)}일`);
console.log(`  최소: ${min8h.toFixed(1)}일 / 최대: ${max8h.toFixed(1)}일`);

// 2시간 플레이
const results2h = [];
for (let i = 0; i < 100; i++) {
  results2h.push(simulate(3, 2, false));
}
const avg2h = results2h.reduce((s, r) => s + r.days, 0) / results2h.length;
const min2h = Math.min(...results2h.map(r => r.days));
const max2h = Math.max(...results2h.map(r => r.days));

console.log('\n[하루 2시간 플레이]');
console.log(`  평균: ${avg2h.toFixed(1)}일`);
console.log(`  최소: ${min2h.toFixed(1)}일 / 최대: ${max2h.toFixed(1)}일`);

console.log('\n=== 요약 ===');
console.log(`하루 2시간: 약 ${Math.round(avg2h)}일`);
console.log(`하루 4시간: 약 ${Math.round(avg4h)}일`);
console.log(`하루 8시간: 약 ${Math.round(avg8h)}일`);
