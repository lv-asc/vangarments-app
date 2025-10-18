'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BetaPioneerBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export default function BetaPioneerBadge({ 
  size = 'medium', 
  showLabel = true, 
  animated = true,
  className = '' 
}: BetaPioneerBadgeProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const BadgeIcon = () => (
    <motion.div
      className={`${sizeClasses[size]} relative flex items-center justify-center`}
      initial={animated ? { scale: 0, rotate: -180 } : {}}
      animate={animated ? { scale: 1, rotate: 0 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.2 
      }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-75"
        animate={animated ? {
          scale: [1, 1.1, 1],
          opacity: [0.75, 0.9, 0.75]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Main badge */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 shadow-lg flex items-center justify-center">
        {/* Inner highlight */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full blur-sm" />
        
        {/* Beta symbol */}
        <span className="text-white font-bold text-xs">β</span>
      </div>
      
      {/* Sparkle effects */}
      {animated && (
        <>
          <motion.div
            className="absolute -top-1 -right-1 w-1 h-1 bg-yellow-300 rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.5
            }}
          />
          <motion.div
            className="absolute -bottom-1 -left-1 w-1 h-1 bg-orange-300 rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 1
            }}
          />
        </>
      )}
    </motion.div>
  );

  if (!showLabel) {
    return <BadgeIcon />;
  }

  return (
    <motion.div
      className={`flex items-center space-x-2 ${className}`}
      initial={animated ? { opacity: 0, y: 10 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.4 }}
    >
      <BadgeIcon />
      <div className="flex flex-col">
        <span className={`font-semibold text-[#00132d] ${textSizeClasses[size]}`}>
          Beta Pioneer
        </span>
        {size !== 'small' && (
          <span className="text-xs text-[#00132d]/60">
            Early Access Member
          </span>
        )}
      </div>
    </motion.div>
  );
}