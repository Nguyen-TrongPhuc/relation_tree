'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Heart } from 'lucide-react';
import { SpecialWish } from '@/lib/tree/wishesData';

export default function WishEnvelope({ wish }: { wish: SpecialWish }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Envelope on the Tree */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 cursor-pointer"
        initial={{ y: 0 }}
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => setIsOpen(true)}
      >
        <div className="relative group">
          {/* Glow effect */}
          <div className={`absolute -inset-6 bg-gradient-to-r ${wish.themeColor} rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse`}></div>
          
          {/* Envelope Icon */}
          <div className={`relative bg-gradient-to-br ${wish.themeColor} p-4 rounded-2xl shadow-xl border border-white/60 backdrop-blur-md transform transition-transform group-hover:scale-110 flex items-center justify-center`}>
            <Mail className="text-white w-10 h-10 drop-shadow-md" />
            <Heart className="absolute -bottom-3 -right-3 text-red-500 w-7 h-7 fill-red-500 animate-bounce drop-shadow-md" />
          </div>
        </div>
      </motion.div>

      {/* Wish Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border-4 border-white overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              {/* Header Decorative Background */}
              <div className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-br ${wish.themeColor} opacity-20`}></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10 text-gray-600 hover:text-gray-900 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative z-10 flex flex-col items-center text-center mt-2">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${wish.themeColor} flex items-center justify-center mb-6 shadow-xl border-4 border-white transform -rotate-12`}>
                  <Mail className="w-10 h-10 text-white fill-white/20" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'cursive' }}>
                  {wish.title}
                </h2>
                
                <div className="relative">
                  <span className="absolute -top-4 -left-4 text-4xl text-gray-200">"</span>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap px-4 italic font-medium z-10 relative">
                    {wish.message}
                  </p>
                  <span className="absolute -bottom-6 -right-4 text-4xl text-gray-200">"</span>
                </div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`mt-10 px-10 py-3.5 rounded-full bg-gradient-to-r ${wish.themeColor} text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2`}
                >
                  <Heart className="w-5 h-5 fill-white" /> Cất giữ kỷ niệm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
