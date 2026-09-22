import { buildTreeState } from './src/lib/tree/engine';

const rawDailyData = [];
for (let i = 0; i < 366; i++) {
  const d = new Date(Date.parse("2026-11-20T00:00:00Z") + i * 86400000);
  rawDailyData.push({ date: d.toISOString().slice(0, 10), activity: 1 });
}

const tree = buildTreeState("2026-11-20", "2027-11-20", rawDailyData, [], 12345);

let woodCount = 0;
let tipCount = 0;
let nonWoodCount = 0;

for (const b of tree.branches) {
  if (b.isWood) woodCount++;
  else nonWoodCount++;
  
  const isParent = tree.branches.some(child => child.parentId === b.id);
  if (!isParent) tipCount++;
}

console.log(`At 1 YEAR (365 days):`);
console.log(`Total branches: ${tree.branches.length}`);
console.log(`Wood branches (Trunk/Main): ${woodCount}`);
console.log(`Non-wood branches (Twigs with leaves): ${nonWoodCount}`);
console.log(`Tip branches: ${tipCount}`);
console.log(`Total leaf/flower clusters: ${nonWoodCount * 3}`);
