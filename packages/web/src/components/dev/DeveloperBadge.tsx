// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DeveloperBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export default function DeveloperBadge({
  size = 'medium',
  showLabel = true,
  className = ''
}: DeveloperBadgeProps) {
  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-sm',
    large: 'w-12 h-12 text-base'
  };

  const labelSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} bg-[#00132d] rounded-full flex items-center justify-center text-[#fff7d7] font-bold shadow-lg border-2 border-white`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2
        }}
      >
        <motion.span
          animate={{
            textShadow: [
              "0 0 4px rgba(255,255,255,0.5)",
              "0 0 8px rgba(255,255,255,0.8)",
              "0 0 4px rgba(255,255,255,0.5)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          DEV
        </motion.span>
      </motion.div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col"
        >
          <span className={`${labelSizes[size]} font-bold text-[#00132d]`}>
            Master Developer
          </span>
          {size !== 'small' && (
            <span className="text-xs text-gray-500">
              Full Access
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}