// ============ 정확한 시뮬레이션 (1초 단위, 빠른 클릭) ============

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
};

const RANK_ORDER = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'imperial'];
const RANK_MULTIPLIERS = { pawn: 1, knight: 2, bishop: 3, rook: 5, queen: 8, king: 12, imperial: 20 };

const AUTO_CLICKERS = [
  { id: 'hammer', clicksPerSec: 0.5, baseCost: 300, unlockRank: 'pawn', unlockLevel: 0 },
  { id: 'pickaxe', clicksPerSec: 1, baseCost: 1800, unlockRank: 'pawn', unlockLevel: 4 },
  { id: 'mace', clicksPerSec: 3, baseCost: 9000, unlockRank: 'knight', unlockLevel: 0 },
  { id: 'drill', clicksPerSec: 8, baseCost: 48000, unlockRank: 'bishop', unlockLevel: 0 },
  { id: 'dynamite', clicksPerSec: 20, baseCost: 240000, unlockRank: 'rook', unlockLevel: 0 },
  { id: 'laser', clicksPerSec: 50, baseCost: 1200000, unlockRank: 'queen', unlockLevel: 0 },
  { id: 'blackhole', clicksPerSec: 120, baseCost: 9000000, unlockRank: 'king', unlockLevel: 0 },
];

const STONE_BASE_HP = 150;
const STONE_HP_GROWTH_RATE = 0.004;

function formatNum(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + '조';
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '억';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '만';
  return Math.floor(n).toLocaleString();
}

function simulate15Minutes(clicksPerSec = 8) {
  let gold = 0;
  let rankIndex = 0;
  let level = 0;
  let stonesDestroyed = 0;

  // 업그레이드 레벨
  let goldUpgradeLevel = 1;
  let attackUpgradeLevel = 1;

  // 도구
  let toolCounts = [0, 0, 0, 0, 0, 0, 0];
  let autoClicksPerSec = 0;

  const totalSeconds = 15 * 60; // 15분

  console.log('=== 15분 집중 플레이 시뮬레이션 ===\n');
  console.log(`클릭 속도: ${clicksPerSec}/초\n`);

  for (let sec = 1; sec <= totalSeconds; sec++) {
    // 현재 스탯 계산
    const goldPerClick = 1 + (goldUpgradeLevel - 1);
    const baseAttack = 1 + (attackUpgradeLevel - 1);
    const rankMultiplier = RANK_MULTIPLIERS[RANK_ORDER[rankIndex]];
    const levelBonus = 1 + level * 0.1;
    const attackPower = Math.floor(baseAttack * rankMultiplier * levelBonus);

    // 바둑돌 HP 계산
    const growthMultiplier = Math.pow(1 + STONE_HP_GROWTH_RATE, stonesDestroyed);
    let totalReduction = 0;
    for (let i = 0; i < rankIndex; i++) {
      totalReduction += 17 * 0.002;
    }
    totalReduction += level * 0.002;
    const reductionMultiplier = Math.max(0.1, 1 - totalReduction);
    const stoneHp = Math.max(10, Math.floor(STONE_BASE_HP * growthMultiplier * reductionMultiplier));

    // 총 클릭 수 (수동 + 자동)
    const totalClicks = clicksPerSec + autoClicksPerSec;

    // 골드 획득
    const clickGold = totalClicks * goldPerClick;

    // 바둑돌 파괴
    const totalDamage = totalClicks * attackPower;
    const stonesThisSec = Math.max(0.01, totalDamage / stoneHp);
    const destroyBonus = Math.floor(stonesThisSec * stoneHp * goldPerClick * 0.1);

    gold += clickGold + destroyBonus;
    stonesDestroyed += stonesThisSec;

    // 업그레이드 구매 (골드 업그레이드 우선)
    for (let i = 0; i < 10; i++) {
      const goldUpgradeCost = Math.floor(50 * Math.pow(1.08, goldUpgradeLevel - 1));
      if (gold >= goldUpgradeCost && goldUpgradeLevel < 500) {
        gold -= goldUpgradeCost;
        goldUpgradeLevel++;
      } else break;
    }

    for (let i = 0; i < 10; i++) {
      const attackUpgradeCost = Math.floor(100 * Math.pow(1.20, attackUpgradeLevel - 1));
      if (gold >= attackUpgradeCost && attackUpgradeLevel < 500) {
        gold -= attackUpgradeCost;
        attackUpgradeLevel++;
      } else break;
    }

    // 도구 구매
    for (let i = 0; i < AUTO_CLICKERS.length; i++) {
      const tool = AUTO_CLICKERS[i];
      const toolRankIndex = RANK_ORDER.indexOf(tool.unlockRank);
      if (rankIndex > toolRankIndex || (rankIndex === toolRankIndex && level >= tool.unlockLevel)) {
        const cost = Math.floor(tool.baseCost * Math.pow(1.50, toolCounts[i]));
        if (gold >= cost && toolCounts[i] < 50) {
          gold -= cost;
          toolCounts[i]++;
          autoClicksPerSec = toolCounts.reduce((sum, c, idx) => sum + c * AUTO_CLICKERS[idx].clicksPerSec, 0);
        }
      }
    }

    // 강화 시도 (골드가 있으면 바로!)
    if (level < 17) {
      const enhanceCost = Math.floor(ENHANCE_RATES[level].cost * RANK_ENHANCE_MULTIPLIERS[RANK_ORDER[rankIndex]].costMultiplier);

      while (gold >= enhanceCost && level < 17) {
        gold -= enhanceCost;

        const successRate = Math.max(10, ENHANCE_RATES[level].successRate + RANK_ENHANCE_MULTIPLIERS[RANK_ORDER[rankIndex]].successRateBonus);
        const destroyRate = level < 4 ? 0 : ENHANCE_RATES[level].destroyRate + RANK_ENHANCE_MULTIPLIERS[RANK_ORDER[rankIndex]].destroyRateBonus;

        const roll = Math.random() * 100;
        if (roll < successRate) {
          level++;
          if (level >= 17 && rankIndex < 6) {
            console.log(`⭐ [${Math.floor(sec/60)}분 ${sec%60}초] ${RANK_ORDER[rankIndex]} 대장 달성! → ${RANK_ORDER[rankIndex + 1]} 진화!`);
            rankIndex++;
            level = 0;
          }
        } else if (roll < successRate + destroyRate) {
          level = 0;
        }

        // 다음 강화 비용 재계산
        break;
      }
    }

    // 1분마다 로그
    if (sec % 60 === 0) {
      const min = sec / 60;
      console.log(`[${min}분] ${RANK_ORDER[rankIndex]} ${ENHANCE_RATES[level]?.name || '??'} | 골드: ${formatNum(gold)} | 공격력: ${attackPower} | 자동: ${autoClicksPerSec.toFixed(1)}/s | 골드업: ${goldUpgradeLevel} | 공격업: ${attackUpgradeLevel}`);
    }
  }

  console.log(`\n=== 15분 후 결과 ===`);
  console.log(`현재 체스말: ${RANK_ORDER[rankIndex]}`);
  console.log(`현재 계급: ${ENHANCE_RATES[level]?.name || '대장'}`);
  console.log(`보유 골드: ${formatNum(gold)}`);
  console.log(`파괴한 돌: ${Math.floor(stonesDestroyed)}개`);
  console.log(`골드 업그레이드: ${goldUpgradeLevel}레벨`);
  console.log(`공격력 업그레이드: ${attackUpgradeLevel}레벨`);
  console.log(`자동 클릭: ${autoClicksPerSec.toFixed(1)}/초`);
}

// 다양한 클릭 속도로 테스트
console.log('\n========================================');
console.log('빠른 탭 (8클릭/초)');
console.log('========================================\n');
simulate15Minutes(8);

console.log('\n\n========================================');
console.log('매우 빠른 탭 (12클릭/초)');
console.log('========================================\n');
simulate15Minutes(12);
