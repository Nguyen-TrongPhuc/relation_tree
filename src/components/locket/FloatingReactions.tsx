'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingReactionsRef {
  triggerReaction: (emoji: string, x: number, y: number) => void;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  angle: number;
  velocity: number;
}

const FloatingReactions = forwardRef<FloatingReactionsRef>((_, ref) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useImperativeHandle(ref, () => ({
    triggerReaction: (emoji: string, x: number, y: number) => {
      const newReactions = Array.from({ length: 6 }).map((_, i) => ({
        id: Math.random().toString(),
        emoji,
        x,
        y,
        angle: (Math.PI * 2 * i) / 6 + (Math.random() - 0.5),
        velocity: 60 + Math.random() * 40,
      }));
      setReactions((prev) => [...prev, ...newReactions]);
    },
  }));

  useEffect(() => {
    if (reactions.length > 0) {
      const timer = setTimeout(() => {
        setReactions((prev) => prev.filter(r => Date.now() - parseInt(r.id.split('.')[1] || '0') < 1000));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, scale: 0.5, x: r.x, y: r.y }}
            animate={{
              opacity: 0,
              scale: 2,
              x: r.x + Math.cos(r.angle) * r.velocity,
              y: r.y + Math.sin(r.angle) * r.velocity - 100, // Move up
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute text-3xl drop-shadow-lg"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingReactions.displayName = 'FloatingReactions';
export default FloatingReactions;
