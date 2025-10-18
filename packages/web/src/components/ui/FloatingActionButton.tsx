'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FloatingAction[];
  mainIcon?: string;
  mainColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function FloatingActionButton({
  actions,
  mainIcon = '+',
  mainColor = 'bg-[#00132d] text-[#fff7d7]',
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  const getActionPosition = (index: number) => {
    const baseOffset = 70;
    const offset = baseOffset * (index + 1);
    
    switch (position) {
      case 'bottom-right':
      case 'bottom-left':
        return { bottom: offset };
      case 'top-right':
      case 'top-left':
        return { top: offset };
      default:
        return { bottom: offset };
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ 
                  duration: 0.2, 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                className="absolute"
                style={getActionPosition(index)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {(position.includes('right')) && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className="bg-[#00132d] text-[#fff7d7] px-3 py-1 rounded-lg text-sm whitespace-nowrap"
                    >
                      {action.label}
                    </motion.div>
                  )}
                  
                  <motion.button
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-12 h-12 rounded-full ${action.color || 'bg-[#00132d] text-[#fff7d7]'} shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-lg`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {action.icon}
                  </motion.button>
                  
                  {(position.includes('left')) && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className="bg-[#00132d] text-[#fff7d7] px-3 py-1 rounded-lg text-sm whitespace-nowrap"
                    >
                      {action.label}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full ${mainColor} shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-2xl relative overflow-hidden`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {/* Background pulse effect */}
        <motion.div
          className="absolute inset-0 bg-[#fff7d7] rounded-full"
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ 
            scale: isOpen ? [0, 1.2, 0] : 0,
            opacity: isOpen ? [0.3, 0, 0] : 0
          }}
          transition={{ duration: 0.6, repeat: isOpen ? Infinity : 0, repeatDelay: 1 }}
        />
        
        <span className="relative z-10">
          {isOpen ? '×' : mainIcon}
        </span>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#00132d]/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}