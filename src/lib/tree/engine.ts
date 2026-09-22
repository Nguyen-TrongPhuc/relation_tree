import { createPRNG } from './random';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export interface DailyGrowth {
  date: string;      
  activity: number;  
  contribution: number;
}

export type TreePhase = 'seedling' | 'sapling' | 'young' | 'mature' | 'ancient';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type EvolutionEvent = 'none' | 'pot-to-ground' | 'small-to-medium' | 'medium-to-large' | 'one-year';

export interface Point2D {
  x: number;
  y: number;
}

export interface BranchState {
  id: string;              
  parentId: string | null; 
  depth: number;
  monthIndex: number;      
  
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;

  length: number;
  thickness: number;
  
  isFlower: boolean;       
  isWood: boolean;         
  leafColor: string;
  leafScale: number;
}

export interface TreeState {
  phase: TreePhase;
  ageDays: number;
  currentWeek: number;
  treeGrowth: number;       
  seedlingStemProgress: number; 

  branches: BranchState[];

  hasSwing: boolean;       
  hasBirdNest: boolean;    
  hasButterflies: boolean; 

  season: Season;
  evolutionEvent: EvolutionEvent;
}

export interface EventData {
  type: string;
  date: string;
}

// ==========================================
// 2. UTILITIES
// ==========================================
export function getSeasonForMonth(startDate: string, mIndex: number): Season {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + mIndex);
  const month = d.getMonth() + 1;
  if (month >= 2 && month <= 4) return 'spring'; 
  if (month >= 5 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function getGlobalSeasonInfo(ageDays: number): { currentSeason: Season, nextSeason: Season, progress: number, globalScale: number } {
    const clampedAge = Math.min(ageDays, 365);
    const yearDay = ((clampedAge - 1) % 365) + 1;
    
    // Custom season lengths requested by user
    const summerLen = 275; // Green leaves
    const autumnLen = 40;  // Yellow/Orange leaves
    const winterLen = 20;  // Bare branches
    const springLen = 30;  // Pink flowers
    
    let currentSeason: Season;
    let nextSeason: Season;
    let seasonLength: number;
    let dayOfSeason: number;
    
    if (yearDay <= summerLen) {
        currentSeason = 'summer';
        nextSeason = 'autumn';
        seasonLength = summerLen;
        dayOfSeason = yearDay - 1;
    } else if (yearDay <= summerLen + autumnLen) {
        currentSeason = 'autumn';
        nextSeason = 'winter';
        seasonLength = autumnLen;
        dayOfSeason = yearDay - 1 - summerLen;
    } else if (yearDay <= summerLen + autumnLen + winterLen) {
        currentSeason = 'winter';
        nextSeason = 'spring';
        seasonLength = winterLen;
        dayOfSeason = yearDay - 1 - summerLen - autumnLen;
    } else {
        currentSeason = 'spring';
        nextSeason = 'spring';
        seasonLength = springLen;
        dayOfSeason = yearDay - 1 - summerLen - autumnLen - winterLen;
    }
    
    let progress = 0;
    // Transition in the last 15 days of the season
    const transitionDays = 15;
    if (dayOfSeason > seasonLength - transitionDays) {
        progress = (dayOfSeason - (seasonLength - transitionDays)) / transitionDays;
    }
    
    let globalScale = 1.0;
    if (currentSeason === 'winter') {
        globalScale = 0.0; // Completely bare
    } else if (currentSeason === 'spring') {
        if (dayOfSeason <= 20) {
            globalScale = Math.max(0.01, dayOfSeason / 20); // Bloom gradually over first 20 days
        }
    }
    
    return { currentSeason, nextSeason, progress, globalScale };
}

export function interpolateColor(start: string, end: string, progress: number): string {
  const amount = Math.min(1, Math.max(0, progress));
  const startRgb = start.match(/[A-Fa-f0-9]{2}/g)!.map(p => parseInt(p, 16));
  const endRgb = end.match(/[A-Fa-f0-9]{2}/g)!.map(p => parseInt(p, 16));
  const channels = startRgb.map((ch, i) => Math.round(ch + (endRgb[i] - ch) * amount));
  return `#${channels.map(ch => ch.toString(16).padStart(2, '0')).join('')}`;
}

export function getVietnamTime(dateObj: Date): Date {
  const vnTimeString = dateObj.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
  return new Date(vnTimeString);
}

export function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatYYYYMM(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getEvolutionEvent(ageDays: number): EvolutionEvent {
  if (ageDays === 8) return 'pot-to-ground';
  if (ageDays === 31) return 'small-to-medium';
  if (ageDays === 211) return 'medium-to-large';
  if (ageDays === 366) return 'one-year';
  return 'none';
}

// ==========================================
// 3. ENGINE
// ==========================================
export function buildTreeState(
  startDate: string,        
  todayStr: string,         
  rawDailyData: { date: string; activity: number }[],
  events: EventData[] = [],
  seed: number = 12345
): TreeState {
  
  const msPerDay = 86400000;
  const ageDays = Math.max(1, Math.floor((Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / msPerDay) + 1);
  const t = (ageDays - 1) / 30.436875; // Time in months (0.0 to 12.0+)
  
  const currentMonthIndex = Math.floor(t);
  const monthProgress = t - currentMonthIndex;
  
  const phase = ageDays <= 7 ? 'seedling' : 'mature';
  const treeGrowth = Math.min(1, ageDays / 365);
  
  const seasonInfo = getGlobalSeasonInfo(ageDays);
  const season = seasonInfo.currentSeason;
  
  const branchPrng = createPRNG(seed);
  
  const palettes = {
      spring: ['#ff66b2', '#ff99cc', '#ffb3d9', '#ffc9e0', '#ff4da6', '#ffffff'],
      summer: ['#81c784', '#aed581', '#66bb6a', '#4caf50', '#8bc34a', '#c8e6c9'],
      autumn: ['#ff9800', '#ff7043', '#ffc107', '#e65100', '#bf360c', '#ffcc80'],
      winter: ['#8D6E63']
  };

  // --- GENERATE PYTHON FRACTAL TOPOLOGY ---
  interface PythonNode {
      id: number;
      parentId: number | null;
      depth: number;
      angle: number;
      length: number;
  }
  
  const fractalNodes: PythonNode[] = [];
  let idCounter = 0;
  
  function generatePythonTree(
      parentId: number | null, 
      depth: number, 
      length: number, 
      currentAngle: number,
      currentX: number,
      currentY: number
  ) {
      if (length <= 4) return;
      if (idCounter >= 4000) return; // Safety limit
      
      const endX = currentX + Math.cos(currentAngle * Math.PI / 180) * length;
      const endY = currentY + Math.sin(currentAngle * Math.PI / 180) * length;
      
      // Heart boundary check
      if (depth > 0) {
          const X = endX / 320; // Width scale
          const Y = -0.833 + ((-115 - endY) / 450) * 1.833; // Height scale
          const val = X * X + Math.pow(1.2 * Y - Math.sqrt(Math.abs(X)), 2);
          if (val > 1.3) {
              // Reached outside the heart boundary!
              // Make this a tip by not spawning children.
              const id = idCounter++;
              fractalNodes.push({ id, parentId, depth, angle: currentAngle, length });
              return;
          }
      }
      
      const id = idCounter++;
      fractalNodes.push({ id, parentId, depth, angle: currentAngle, length });
      
      let angle1 = 15 + branchPrng() * 23; // 15 to 38
      let angle2 = 15 + branchPrng() * 23; // 15 to 38
      let subLenLeft = length - (7 + branchPrng() * 5); // 7 to 12
      let subLenRight = length - (7 + branchPrng() * 5); // 7 to 12
      
      // Force perfect symmetry on the very first split to prevent the tree from leaning
      if (depth === 0) {
          const symAngle = 25 + branchPrng() * 10;
          angle1 = symAngle;
          angle2 = symAngle;
          const symLen = length - (8 + branchPrng() * 2);
          subLenLeft = symLen;
          subLenRight = symLen;
      }
      
      generatePythonTree(id, depth + 1, subLenLeft, currentAngle - angle1, endX, endY);
      generatePythonTree(id, depth + 1, subLenRight, currentAngle + angle2, endX, endY);
  }
  
  // Base length 115, straight up, starting at (0,0)
  generatePythonTree(null, 0, 115, -90, 0, 0);
  
  // Sort nodes so they grow from bottom up and center out
  fractalNodes.sort((a, b) => a.depth !== b.depth ? a.depth - b.depth : a.id - b.id);
  
  const branchT = (ageDays - 1) / 30.436875; 
  const totalNodes = fractalNodes.length;
  
  const nodesWithTime = fractalNodes.map((node, index) => {
      const progress = index / totalNodes;
      const timeProgress = Math.pow(progress, 0.35);
      const revealMonth = timeProgress * 11.5;
      
      // Precompute random properties so they are completely stable
      return { 
          ...node, 
          revealMonth, 
          monthIndex: Math.min(11, Math.floor(revealMonth)),
          randLeafScaleTip: 1.5 + branchPrng() * 1.5,
          randLeafScaleNonTip: 0.8 + branchPrng() * 1.0,
          randCIdxStr: branchPrng(),
          randNIdxStr: branchPrng()
      };
  });

  // --- COMPUTE ACTIVE BRANCHES ---
  const branches: BranchState[] = [];
  const nodeMap = new Map<number, BranchState>();
  const activeParentIds = new Set<number>();
  
  const activeNodesData: { node: typeof nodesWithTime[0], growthProgress: number, aliveMonths: number }[] = [];
  
  for (const node of nodesWithTime) {
      if (branchT < node.revealMonth) continue; 
      
      const aliveMonths = branchT - node.revealMonth;
      const gp = Math.min(1, aliveMonths / 1.5);
      
      if (gp > 0.01) {
          activeNodesData.push({ node, growthProgress: gp, aliveMonths });
          if (node.parentId !== null) activeParentIds.add(node.parentId);
      }
  }

  // Second pass: Calculate coordinates and properties
  for (const { node, growthProgress, aliveMonths } of activeNodesData) {
      let startX = 0;
      let startY = 0;
      
      if (node.parentId !== null) {
          const parentBranch = nodeMap.get(node.parentId);
          if (!parentBranch) continue;
          startX = parentBranch.endX;
          startY = parentBranch.endY;
      }
  
      const actualLength = node.length * growthProgress;
      const angleRad = node.angle * Math.PI / 180;
      const endX = startX + Math.cos(angleRad) * actualLength;
      const endY = startY + Math.sin(angleRad) * actualLength;
      
      const thicknessProgress = Math.min(1, aliveMonths / 8.0);
      const thickness = Math.max(1.5, (node.length / 9) * thicknessProgress);
      const isWood = node.length >= 16;
      
      const isTip = !activeParentIds.has(node.id);
      const hasLeaves = (node.length < 55 || isTip) && seasonInfo.globalScale > 0;
      
      let isFlower = false;
      let leafColor = '#4d2600';
      let leafScale = 0;
      
      if (hasLeaves) {
          leafScale = isTip ? node.randLeafScaleTip : node.randLeafScaleNonTip;
          leafScale *= Math.pow(growthProgress, 0.5); 
          leafScale *= seasonInfo.globalScale; 
          
          if (leafScale > 0) {
              const currentPalette = palettes[seasonInfo.currentSeason];
              const nextPalette = palettes[seasonInfo.nextSeason];
              
              const cIdx = Math.floor(node.randCIdxStr * currentPalette.length);
              const nIdx = Math.floor(node.randNIdxStr * nextPalette.length); 
              
              const baseColor = currentPalette[cIdx];
              const nextColor = nextPalette[nIdx];
              
              leafColor = interpolateColor(baseColor, nextColor, seasonInfo.progress);
              
              // Spring: full bloom
              if (seasonInfo.currentSeason === 'spring' || (seasonInfo.nextSeason === 'spring' && seasonInfo.progress > 0)) {
                  isFlower = true;
              }
              
              // Scattered flowers on mature tree (day 180+, summer only, ~12% of tip branches)
              if (!isFlower && isTip && ageDays >= 180 && seasonInfo.currentSeason === 'summer') {
                  const flowerHash = Math.abs(Math.sin(node.id * 31.7)) ;
                  if (flowerHash < 0.12) {
                      isFlower = true;
                      // Use a soft pink instead of green for scattered flowers
                      leafColor = ['#ff99cc', '#ffb3d9', '#ff66b2'][Math.floor(flowerHash * 25) % 3];
                  }
              }
          }
      }
      
      const branchState: BranchState = {
          id: node.id.toString(),
          parentId: node.parentId !== null ? node.parentId.toString() : null,
          depth: node.depth,
          monthIndex: node.monthIndex,
          startX, startY, endX, endY,
          angle: node.angle,
          length: actualLength,
          thickness,
          isWood,
          isFlower,
          leafColor,
          leafScale
      };
      
      nodeMap.set(node.id, branchState);
      branches.push(branchState);
  }

  return {
    phase,
    ageDays,
    currentWeek: Math.floor((ageDays - 1) / 7),
    treeGrowth,
    seedlingStemProgress: phase === 'seedling' ? Math.min(1, (ageDays - 1) / 6) : 1,
    branches,
    hasSwing: ageDays >= 240,
    hasBirdNest: ageDays >= 120,
    hasButterflies: ageDays >= 90,
    season,
    evolutionEvent: getEvolutionEvent(ageDays),
  };
}
