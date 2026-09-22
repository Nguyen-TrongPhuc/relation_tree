export interface FoliageData {
  id: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  colorVariant: number; // 0 to 1 for slight color tweaking
}

export interface FlowerData {
  id: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

export interface BranchData {
  id: string;
  length: number;
  radiusBottom: number;
  radiusTop: number;
  rotation: [number, number, number]; // Euler angles relative to parent
  children: BranchData[];
  foliage: FoliageData[];
  flowers: FlowerData[];
}

export interface TreeData {
  root: BranchData;
}
