'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeState, BranchState, interpolateColor, getGlobalSeasonInfo } from '@/lib/tree/engine';

function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash);
}

function VectorCloud({ delay, duration, top, scale, opacity, phase }: any) {
  const isNight = phase === 'night';
  return (
    <motion.div
      className="absolute"
      style={{ top, left: '-20%', scale, opacity, zIndex: 10, pointerEvents: 'none' }}
      animate={{ left: ['-20%', '120%'] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <svg width="200" height="100" viewBox="0 0 200 100">
        <path d="M 50,60 Q 50,40 70,40 Q 90,20 120,30 Q 150,30 160,50 Q 180,60 160,80 L 40,80 Q 20,60 50,60 Z" fill={isNight ? "#424242" : "#FFFFFF"} />
      </svg>
    </motion.div>
  );
}

function getFinaleTarget(seedStr: string) {
    const seed = hashString(seedStr);
    const r1 = ((seed * 19349663 + 83979) % 100000) / 100000;
    const r2 = ((seed * 19349669 + 83983) % 100000) / 100000;
    
    const t = r1 * Math.PI * 2;
    const r = Math.sqrt(r2); // uniform area distribution
    
    const rawX = 16 * Math.pow(Math.sin(t), 3);
    const rawY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    
    const size = 18;
    return { 
        x: rawX * size * r, 
        y: rawY * size * r - 450 
    };
}

function getLeafRotationDeg(angleDeg: number | undefined, isFinale: boolean) {
  if (isFinale) return 0;
  const baseAngle = typeof angleDeg === 'number' ? angleDeg : -90;
  return (baseAngle + 90 + 360) % 360;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = id.charCodeAt(i) + ((h << 5) - h);
  }
  return h;
}

function CherryBlossomPetals({ color }: { color: string }) {
  return (
    <>
      {[0, 72, 144, 216, 288].map((deg) => (
        <path
          key={deg}
          d="M 0,0 C -3,-4 -3,-9 0,-12 C 3,-9 3,-4 0,0"
          fill={color}
          opacity="0.85"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx="0" cy="0" r="2" fill="#FFE082" />
    </>
  );
}

function CherryBlossomCluster({ x, y, scale, color, delay, isFinale, id, isFlower, angle = -90, yearDay = 0, isWinter = false, dayStartTime = 0 }: any) {
  const target = isFinale ? getFinaleTarget(id) : { x: Number(x), y: Number(y) };
  const rotationDeg = getLeafRotationDeg(angle, isFinale);
  
  const hash = hashId(id);
  const fallDay = 301 + (Math.abs(hash) % 15);
  
  // For past days: already on ground. For today: check real wall-clock time
  const fallFraction = Math.abs(Math.sin(hash * 7)); // 0 to 1 of the 24h day
  const fallTimestamp = dayStartTime + fallFraction * 86400 * 1000;
  const hasAlreadyFallen = yearDay > fallDay && yearDay < 336;
  const isFallingToday = yearDay === fallDay;
  const hasFallenToday = isFallingToday && Date.now() >= fallTimestamp;
  const isFallen = (hasAlreadyFallen || hasFallenToday) && !isFinale;
  
  const groundX = target.x + Math.sin(hash) * 150;
  const groundY = Math.abs(Math.cos(hash)) * 30 + 10;
  const groundRotation = hash % 360;
  
  const finalX = isFallen ? groundX : target.x;
  const finalY = isFallen ? groundY : target.y;
  const finalRot = isFallen ? groundRotation : rotationDeg;
  
  // Deterministic random values for animation based on hash
  const animDuration = 4 + (Math.abs(hash) % 200) / 100; // 4 to 6
  const animDelay = (Math.abs(hash) % 200) / 100; // 0 to 2

  return (
    <g 
      style={{ 
         transform: `translate(${finalX.toFixed(3)}px, ${finalY.toFixed(3)}px) scale(${Number(scale).toFixed(3)}) rotate(${finalRot.toFixed(3)}deg)`,
         transformOrigin: "0px 0px",
         opacity: isFallen && isWinter ? 0 : 1,
         transition: hasAlreadyFallen ? "none" : "transform 3s ease-in, opacity 1s ease-in"
      }}
    >
      <motion.g
        animate={{ rotate: isFallen ? 0 : [-8, 8, -8] }}
        transition={{ duration: animDuration, repeat: Infinity, ease: 'easeInOut', delay: animDelay }}
        style={{ transformOrigin: "0px 0px" }}
      >
        {isFlower ? (
          <g transform="scale(0.45)">
            <CherryBlossomPetals color={color} />
          </g>
        ) : (
          <g transform="scale(0.35) translate(0, 10)">
            <path d="M 0,0 Q -15,-5 -20,-20 Q -5,-15 0,0" fill={color} />
            <path d="M 0,0 Q 15,-5 20,-20 Q 5,-15 0,0" fill={color} />
          </g>
        )}
      </motion.g>
    </g>
  );
}

function AnimatedCherryBlossomCluster(props: any) {
  const target = props.isFinale ? getFinaleTarget(props.id) : { x: Number(props.x), y: Number(props.y) };
  const targetRotation = getLeafRotationDeg(props.angle, props.isFinale);
  
  const hash = hashId(props.id);
  
  // Falling physics: each leaf falls at a specific time within the 24h day
  const fallDay = 301 + (Math.abs(hash) % 15);
  const fallFraction = Math.abs(Math.sin(hash * 7)); // 0 to 1 of the 24h day
  const fallTimestamp = (props.dayStartTime || 0) + fallFraction * 86400 * 1000;
  const hasAlreadyFallen = (props.yearDay ?? 0) > fallDay && (props.yearDay ?? 0) < 336;
  const isFallingToday = (props.yearDay ?? 0) === fallDay;
  const hasFallenToday = isFallingToday && Date.now() >= fallTimestamp;
  const isFallen = (hasAlreadyFallen || hasFallenToday) && !props.isFinale;

  const randomX = Math.sin(hash) * 150;
  const groundY = Math.abs(Math.cos(hash)) * 30 + 10;
  const fallDuration = hasAlreadyFallen ? 0.01 : 3;
  
  const finalX = isFallen ? target.x + randomX : target.x;
  const finalY = isFallen ? groundY : target.y;
  const finalRotation = isFallen ? targetRotation + (Math.sin(hash) * 180) : targetRotation;
  const finalOpacity = isFallen && props.isWinter ? 0 : 1;
  
  // Deterministic animation
  const animDuration = 4 + (Math.abs(hash) % 200) / 100;
  const animDelay = (Math.abs(hash) % 200) / 100;

  return (
    <motion.g
      initial={{ 
        x: Number(Number(props.x).toFixed(3)), 
        y: Number(Number(props.y).toFixed(3)), 
        scale: 0, 
        opacity: 0, 
        rotate: Number((targetRotation - 30).toFixed(3)) 
      }}
      animate={{ 
        x: Number(finalX.toFixed(3)),  
        y: Number(finalY.toFixed(3)), 
        scale: Number(props.scale), 
        opacity: finalOpacity, 
        rotate: Number(finalRotation.toFixed(3)) 
      }}
      transition={{ 
        duration: isFallen ? fallDuration : (props.isFinale ? 3 : 1.5), 
        delay: props.isFinale ? 0 : props.delay, 
        ease: isFallen ? 'easeInOut' : (props.isFinale ? [0.4, 0, 0.2, 1] : 'easeOut') 
      }}
      style={{ transformOrigin: "0px 0px" }}
    >
      <motion.g
        animate={{ rotate: isFallen ? 0 : [-8, 8, -8] }}
        transition={{ duration: animDuration, repeat: Infinity, ease: 'easeInOut', delay: animDelay }}
        style={{ transformOrigin: "0px 0px" }}
      >
        {props.isFlower ? (
          <g transform="scale(0.45)">
            <CherryBlossomPetals color={props.color} />
          </g>
        ) : (
          <g transform="scale(0.35) translate(0, 10)">
            <path d="M 0,0 Q -15,-5 -20,-20 Q -5,-15 0,0" fill={props.color} />
            <path d="M 0,0 Q 15,-5 20,-20 Q 5,-15 0,0" fill={props.color} />
          </g>
        )}
      </motion.g>
    </motion.g>
  );
}

function CotyledonLeaves({ x, y, scale, color, ageDays }: { x: number, y: number, scale: number, color: string, ageDays: number }) {
  const isFalling = ageDays >= 16;
  const isGone = ageDays >= 40;

  if (isGone) return null;

  const dropY = Math.abs(y); // distance to ground

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Left Leaf */}
      <motion.g
        initial={false}
        animate={{ 
            y: isFalling ? dropY : 0, 
            x: isFalling ? -30 : 0, 
            rotate: isFalling ? -120 : 0,
            opacity: isFalling ? 0 : 1 
        }}
        transition={{ 
            duration: isFalling ? 2.5 : 0.5, // 2.5 real seconds to fall
            ease: isFalling ? "easeIn" : "easeOut" 
        }}
      >
        <motion.g animate={{ rotate: isFalling ? 0 : [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: "0px 0px" }}>
          <path d="M 0,0 Q -15,-5 -20,-20 Q -5,-15 0,0" fill={isFalling ? '#FFB74D' : color} style={{ transition: 'fill 2.5s' }} />
        </motion.g>
      </motion.g>

      {/* Right Leaf */}
      <motion.g
        initial={false}
        animate={{ 
            y: isFalling ? dropY * 0.95 : 0, 
            x: isFalling ? 35 : 0, 
            rotate: isFalling ? 140 : 0,
            opacity: isFalling ? 0 : 1 
        }}
        transition={{ 
            duration: isFalling ? 2.5 : 0.5, 
            delay: isFalling ? 0.3 : 0, // falls slightly after left leaf
            ease: isFalling ? "easeIn" : "easeOut" 
        }}
      >
        <motion.g animate={{ rotate: isFalling ? 0 : [5, -5, 5] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: "0px 0px" }}>
          <path d="M 0,0 Q 15,-5 20,-20 Q 5,-15 0,0" fill={isFalling ? '#FFB74D' : color} style={{ transition: 'fill 2.5s' }} />
        </motion.g>
      </motion.g>
    </g>
  );
}

function GrassTuft({ x, y, scale, delay, color }: { x: number, y: number, scale: number, delay: number, color: string }) {
  return (
    <motion.g
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 1, delay }}
      transform={`translate(${x}, ${y}) scale(${scale})`}
    >
      <path d="M 0,0 Q -5,-15 -10,-20 Q -2,-10 0,0" fill={color} />
      <path d="M 0,0 Q 0,-20 0,-25 Q 2,-10 0,0" fill={color} />
      <path d="M 0,0 Q 5,-15 10,-18 Q 2,-10 0,0" fill={color} />
    </motion.g>
  );
}

const skyGradients = {
  day: 'from-[#81D4FA] to-[#E1F5FE]',
  sunset: 'from-[#FF7043] via-[#FFCA28] to-[#FFECB3]',
  night: 'from-[#1A237E] via-[#311B92] to-[#000000]',
  sunrise: 'from-[#5C6BC0] via-[#FF9800] to-[#FFF3E0]',
};

const ambientTints = {
  day: 'rgba(255,255,255,0)',
  sunset: 'rgba(200, 50, 0, 0.25)',
  night: 'rgba(0, 10, 40, 0.55)',
  sunrise: 'rgba(100, 50, 200, 0.15)',
};

const hillColors = {
  spring: { fg: '#7CB342', mg: '#558B2F', bg: '#33691E' },
  summer: { fg: '#4CAF50', mg: '#2E7D32', bg: '#1B5E20' },
  autumn: { fg: '#FFB300', mg: '#F57C00', bg: '#E65100' },
  winter: { fg: '#E0E0E0', mg: '#BDBDBD', bg: '#9E9E9E' }
};

interface Tree2DProps {
  treeState: TreeState;
  timePhase?: string;
}

export default function Tree2D({ treeState, timePhase = 'day' }: Tree2DProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  useEffect(() => setMounted(true), []);

  const allBranches = treeState.branches;
  const currentMonth = Math.floor((treeState.ageDays - 1) / 30.436);
  const hiddenBranchIds = useMemo(() => {
    const hidden = new Set<string | number>();

    const hideBranchAndDescendants = (branchId: string | number) => {
      hidden.add(branchId);
      allBranches.forEach(b => {
        if (b.parentId === branchId && !hidden.has(b.id)) {
          hideBranchAndDescendants(b.id);
        }
      });
    };

    const terminalBranches = allBranches.filter(
      (branch) => branch.depth === 3 && typeof branch.endX === 'number'
    );

    if (terminalBranches.length > 0) {
      const rightmostEndX = Math.max(...terminalBranches.map((branch) => branch.endX));
      const leftmostEndX = Math.min(...terminalBranches.map((branch) => branch.endX));
      
      const rightBranch = terminalBranches.find((branch) => branch.endX === rightmostEndX);
      const leftBranch = terminalBranches.find((branch) => branch.endX === leftmostEndX);

      // Cắt cành ngoài cùng bên phải (và toàn bộ cành con của nó)
      if (rightBranch) {
        hideBranchAndDescendants(rightBranch.id);
      }

      // Giữ cành ngoài cùng bên trái, nhưng cắt nhánh con bên trái của nó
      if (leftBranch) {
        const children = allBranches.filter(b => b.parentId === leftBranch.id);
        if (children.length > 0) {
          const leftChild = children.reduce((prev, curr) => curr.endX < prev.endX ? curr : prev, children[0]);
          if (leftChild) {
            hideBranchAndDescendants(leftChild.id);
          }
        }
      }
    }

    return hidden;
  }, [allBranches]);

  const visibleBranches = useMemo(
    () => allBranches.filter((branch) => !hiddenBranchIds.has(branch.id)),
    [allBranches, hiddenBranchIds]
  );

  const colors = hillColors[treeState.season];
  const isFinale = treeState.ageDays >= 366;
  const isWinter = treeState.season === 'winter';
  const yearDay = ((treeState.ageDays - 1) % 365) + 1;
  const isFrozen = yearDay >= 311 && yearDay < 336; // Branches stop swaying in late autumn/winter

  // Track when each yearDay started (real wall-clock time)
  const dayStartTimeRef = useRef<number>(Date.now());
  const prevYearDayRef = useRef<number>(yearDay);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (yearDay !== prevYearDayRef.current) {
      dayStartTimeRef.current = Date.now();
      prevYearDayRef.current = yearDay;
    }
  }, [yearDay]);

  // Re-render every 30 seconds during fall season so leaves progressively fall
  useEffect(() => {
    if (yearDay < 301 || yearDay > 315) return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(interval);
  }, [yearDay]);

  const dayStartTime = dayStartTimeRef.current;

  // Particle System (Fireflies for night, Petals/Leaves for day)
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 800,
      y: -Math.random() * 600,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0 bg-[#E1F5FE]">
      {/* SKY LAYER - DOES NOT ZOOM */}
      <div className={`absolute inset-0 bg-gradient-to-b transition-colors duration-1000 ${mounted ? skyGradients[timePhase as keyof typeof skyGradients] : skyGradients.day}`} />
      
      {/* FINALE OVERLAY */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-[3000ms] pointer-events-none z-50 ${isFinale ? 'opacity-100' : 'opacity-0'}`}>
         <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,105,180,0.8)]" style={{ fontFamily: 'cursive' }}>
            Happy Birthday!
         </h1>
         <p className="mt-6 text-2xl text-white/90 font-medium drop-shadow-md">
            Một năm nhìn lại, tình yêu nở hoa... ❤️
         </p>
      </div>

      {mounted && (
        <motion.div
          className={`absolute top-16 left-16 md:top-24 md:left-32 w-24 h-24 md:w-32 md:h-32 rounded-full blur-[2px] transition-all duration-1000 ${
            timePhase === 'night'
              ? 'bg-gradient-to-br from-[#E0E0E0] to-[#9E9E9E] shadow-[0_0_60px_20px_rgba(255,255,255,0.3)] opacity-90'
              : timePhase === 'sunset' || timePhase === 'sunrise'
              ? 'bg-gradient-to-br from-[#FF9800] to-[#F44336] shadow-[0_0_60px_20px_rgba(255,152,0,0.5)] opacity-90'
              : 'bg-gradient-to-br from-[#FFF59D] to-[#FFB74D] shadow-[0_0_60px_20px_rgba(255,235,59,0.4)] opacity-90'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {mounted && timePhase === 'night' && (
         <div className="absolute inset-0 pointer-events-none">
            {Array.from({length: 50}).map((_, i) => (
              <motion.div key={i}
                className="absolute bg-white rounded-full"
                style={{
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 60 + '%',
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
         </div>
      )}

      {/* ZOOMABLE WORLD LAYER */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
        onWheel={(e) => {
          e.preventDefault();
          setZoom(z => Math.min(2.5, Math.max(0.5, z - e.deltaY * 0.001)));
        }}
        onPointerDown={(e) => {
           // Simple panning logic could go here, but omitted for brevity
        }}
      >
        <svg
          viewBox="-800 -800 1600 1200"
          className="w-[100vw] h-[100vh] overflow-visible"
        >
          <defs>
            <filter id="leafShadow">
              <feDropShadow dx="0" dy="5" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Master Zoom Group */}
          <g 
            style={{ 
                transform: `scale(${zoom}) translate(0px, 200px)`, 
                transformOrigin: '0px 0px',
                transition: 'transform 0.1s ease-out'
            }}
          >
              {/* === BACKGROUND HILLS === */}
              <path d="M -1200,50 Q -600,-150 0,-50 T 1200,0 L 1200,600 L -1200,600 Z" fill={colors.bg} className="transition-colors duration-1000" />
              <path d="M -1200,100 Q -800,-50 -200,-20 T 600,-40 T 1200,50 L 1200,600 L -1200,600 Z" fill={colors.mg} className="transition-colors duration-1000" />
              <path d="M -1200,150 Q -400,-20 0,0 T 1200,100 L 1200,600 L -1200,600 Z" fill={colors.fg} className="transition-colors duration-1000" />
              
              {/* === THE TREE === */}
                <g>
                {/* Seedling Pot */}
                {treeState.ageDays <= 7 && (
                    <g>
                      <path d="M -38,0 L 38,0 L 29,42 L -29,42 Z" fill="#C96F4A" />
                      <path d="M -43,-5 Q 0,-13 43,-5 L 40,7 Q 0,15 -40,7 Z" fill="#E58A5B" />
                      <ellipse cx="0" cy="0" rx="35" ry="7" fill="#6D4C41" />
                      <path d="M -30,12 L 30,12 L 27,29 L -27,29 Z" fill="#B85D3C" opacity="0.45" />
                    </g>
                )}

                {/* Branches */}
                {visibleBranches.map((branch) => {
                  const { startX, startY, endX, endY } = branch;
                  const isRecent = branch.monthIndex >= currentMonth - 1;
                  
                  let pathColor = branch.isWood ? "#4d2600" : "#5d3514";
                  // Smoothly transition trunk from green to brown in the first 14 days
                  if (branch.depth === 0 && treeState.ageDays <= 14) {
                      const progress = Math.min(1, (treeState.ageDays - 1) / 13.0);
                      pathColor = interpolateColor('#4CAF50', '#4d2600', progress);
                  }

                  if (branch.leafScale === 0) {
                        return (
                          <motion.g
                            key={branch.id}
                            animate={branch.depth > 0 && !isFrozen ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
                            transition={branch.depth > 0 && !isFrozen ? { duration: 7, repeat: Infinity, ease: "easeInOut", delay: (hashString(branch.id) % 100) / 100 } : undefined}
                            style={branch.depth > 0 ? { transformOrigin: `${startX}px ${startY}px` } : undefined}
                          >
                              <path
                                  d={`M ${startX.toFixed(3)} ${startY.toFixed(3)} L ${endX.toFixed(3)} ${endY.toFixed(3)}`}
                                  stroke={pathColor}
                                  strokeWidth={branch.thickness.toFixed(2)}
                                  strokeLinecap="round"
                                  fill="none"
                                  style={{ opacity: isFinale ? 0 : 1, transition: 'opacity 3s ease-in-out' }}
                              />
                              {branch.depth === 0 && treeState.ageDays <= 40 && (
                                  <CotyledonLeaves 
                                      x={endX} 
                                      y={endY} 
                                      scale={Math.min(1.5, treeState.ageDays / 5.0)} 
                                      color="#4CAF50"
                                      ageDays={treeState.ageDays}
                                  />
                              )}
                            </motion.g>
                      );
                  }
                  
                  const LeafCmp = isRecent ? AnimatedCherryBlossomCluster : CherryBlossomCluster;
                  const scale = (1.2 * (branch.leafScale || 0)).toFixed(3);
                  
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;
                  const q1X = (startX + midX) / 2;
                  const q1Y = (startY + midY) / 2;
                  const q3X = (midX + endX) / 2;
                  const q3Y = (midY + endY) / 2;

                  // Normal tree leaves fade in after day 10 for the main trunk
                  const flowerOpacity = branch.depth === 0 && treeState.ageDays <= 15 
                      ? Math.max(0, (treeState.ageDays - 5) / 10.0) 
                      : 1;

                    return (
                      <motion.g
                        key={branch.id}
                        animate={branch.depth > 0 && !isFrozen ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
                        transition={branch.depth > 0 && !isFrozen ? { duration: 7, repeat: Infinity, ease: "easeInOut", delay: (hashString(branch.id) % 100) / 100 } : undefined}
                        style={branch.depth > 0 ? { transformOrigin: `${startX}px ${startY}px` } : undefined}
                      >
                          <path
                              d={`M ${startX.toFixed(2)},${startY.toFixed(2)} L ${endX.toFixed(2)},${endY.toFixed(2)}`}
                              stroke={pathColor}
                              strokeWidth={Math.max(1, branch.thickness)}
                              strokeLinecap="round"
                              fill="none"
                              style={{ opacity: isFinale ? 0 : 1, transition: 'opacity 3s ease-in-out' }}
                          />
                          {branch.depth === 0 && treeState.ageDays <= 40 && (
                              <CotyledonLeaves 
                                  x={endX} 
                                  y={endY} 
                                  scale={Math.min(1.5, treeState.ageDays / 5.0)} 
                                  color="#4CAF50"
                                  ageDays={treeState.ageDays}
                              />
                          )}
                          {branch.leafScale > 0 && (
                              <g style={{ opacity: isFinale ? 1 : flowerOpacity, transition: 'opacity 1s ease-in' }}>
                                <LeafCmp x={endX.toFixed(3)} y={endY.toFixed(3)} scale={scale} color={branch.leafColor} delay={Math.random() * 0.3} isFinale={isFinale} id={branch.id + '_end'} isFlower={branch.isFlower} angle={branch.angle} yearDay={yearDay} isWinter={isWinter} dayStartTime={dayStartTime} />
                                {branch.length >= 12 && branch.length < 55 && (
                                  <LeafCmp x={midX.toFixed(3)} y={midY.toFixed(3)} scale={scale} color={branch.leafColor} delay={Math.random() * 0.3} isFinale={isFinale} id={branch.id + '_mid'} isFlower={branch.isFlower} angle={branch.angle} yearDay={yearDay} isWinter={isWinter} dayStartTime={dayStartTime} />
                                )}
                                {!branch.isFlower && branch.length >= 24 && branch.length < 55 && (
                                  <>
                                    <LeafCmp x={q1X.toFixed(3)} y={q1Y.toFixed(3)} scale={(parseFloat(scale) * 0.7).toFixed(3)} color={branch.leafColor} delay={Math.random() * 0.3} isFinale={isFinale} id={branch.id + '_q1'} isFlower={branch.isFlower} angle={branch.angle} yearDay={yearDay} isWinter={isWinter} dayStartTime={dayStartTime} />
                                    <LeafCmp x={q3X.toFixed(3)} y={q3Y.toFixed(3)} scale={(parseFloat(scale) * 0.8).toFixed(3)} color={branch.leafColor} delay={Math.random() * 0.3} isFinale={isFinale} id={branch.id + '_q3'} isFlower={branch.isFlower} angle={branch.angle} yearDay={yearDay} isWinter={isWinter} dayStartTime={dayStartTime} />
                                  </>
                                )}
                              </g>
                          )}
                      </motion.g>
                  );
                })}
              </g>

              {/* Particles */}
              {mounted && treeState.ageDays > 30 && particles.map(p => (
                <motion.circle
                   key={p.id}
                   r={p.size}
                   fill={timePhase === 'night' ? '#FFF59D' : treeState.season === 'spring' ? '#ff99cc' : '#FFB300'}
                   opacity={timePhase === 'night' ? 0.8 : 0.6}
                   initial={{ cx: p.x, cy: p.y }}
                   animate={{ 
                     cx: p.x + (Math.random() * 100 - 50), 
                     cy: p.y + (Math.random() * 100 - 50),
                     opacity: [0, 1, 0]
                   }}
                   transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                />
              ))}

              {/* === GLOBAL LIGHTING TINT === */}
              {/* We apply a massive rect over the whole world layer that blends via multiply */}
              <rect 
                x="-1200" y="-1200" width="2400" height="2400" 
                fill={ambientTints[timePhase as keyof typeof ambientTints] || ambientTints.day} 
                className="pointer-events-none mix-blend-multiply transition-colors duration-1000" 
              />
          </g>
        </svg>
      </div>

      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <VectorCloud delay={0} duration={50} top="10%" scale={1.2} opacity={0.8} phase={timePhase} />
          <VectorCloud delay={15} duration={70} top="25%" scale={0.8} opacity={0.5} phase={timePhase} />
          <VectorCloud delay={30} duration={60} top="15%" scale={1.5} opacity={0.6} phase={timePhase} />
        </div>
      )}
    </div>
  );
}

