'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StyleDNAData {
  dominantStyles: Array<{
    style: string;
    percentage: number;
    description: string;
  }>;
  colorPalette: Array<{
    color: string;
    frequency: number;
    hex: string;
  }>;
  brandAffinity: Array<{
    brand: string;
    itemCount: number;
    totalValue: number;
  }>;
  styleEvolution: Array<{
    period: string;
    dominantStyle: string;
    confidence: number;
  }>;
}

interface StyleDNAAnalysisProps {
  data: StyleDNAData;
  loading?: boolean;
}

export default function StyleDNAAnalysis({ data, loading = false }: StyleDNAAnalysisProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);

  useEffect(() => {
    if (!loading && data) {
      // Animate progress bars
      const timer = setTimeout(() => {
        setAnimatedValues(data.dominantStyles.map(style => style.percentage));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#fff7d7] rounded-xl shadow-lg p-6 border border-[#00132d]/10"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-[#00132d]/20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-[#00132d]/15 rounded"></div>
            <div className="h-4 bg-[#00132d]/15 rounded w-3/4"></div>
            <div className="h-4 bg-[#00132d]/15 rounded w-1/2"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#fff7d7] rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-[#00132d]/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#00132d]">
          Your Style DNA
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#00132d] rounded-full animate-pulse"></div>
          <span className="text-sm text-[#00132d]/70">Live Analysis</span>
        </div>
      </div>
      
      {/* Dominant Styles */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#00132d] mb-4">
          Dominant Styles
        </h3>
        <div className="space-y-4">
          {data.dominantStyles.map((style, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                selectedStyle === style.style 
                  ? 'border-[#00132d] bg-[#00132d]/5 shadow-lg' 
                  : 'border-[#00132d]/20 hover:border-[#00132d]/40 hover:shadow-md'
              }`}
              onClick={() => setSelectedStyle(selectedStyle === style.style ? null : style.style)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#00132d] text-lg">{style.style}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-[#00132d]">{style.percentage}%</span>
                  <motion.div
                    animate={{ rotate: selectedStyle === style.style ? 180 : 0 }}
                    className="text-[#00132d]/60"
                  >
                    ▼
                  </motion.div>
                </div>
              </div>
              
              <div className="relative mb-3">
                <div className="w-full bg-[#00132d]/10 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-3 rounded-full bg-[#00132d]"
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedValues[index] || 0}%` }}
                    transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fff7d7] to-transparent opacity-30 animate-pulse"></div>
              </div>
              
              <AnimatePresence>
                {selectedStyle === style.style && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-[#00132d]/20"
                  >
                    <p className="text-sm text-[#00132d]/80 leading-relaxed">{style.description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="px-2 py-1 bg-[#00132d]/10 text-[#00132d] text-xs rounded-full">
                        Primary Style
                      </span>
                      {style.percentage > 30 && (
                        <span className="px-2 py-1 bg-[#00132d]/20 text-[#00132d] text-xs rounded-full">
                          Strong Match
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#00132d] mb-4">
          Your Color Palette
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {data.colorPalette.map((color, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center group cursor-pointer"
            >
              <div className="relative">
                <motion.div 
                  className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-[#fff7d7] shadow-lg group-hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: color.hex }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                />
                <div className="absolute inset-0 w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-[#fff7d7]/20 to-transparent"></div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-6 h-6 bg-[#00132d] text-[#fff7d7] text-xs rounded-full flex items-center justify-center font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  {color.frequency}
                </motion.div>
              </div>
              <p className="text-sm font-semibold text-[#00132d]">{color.color}</p>
              <p className="text-xs text-[#00132d]/60">
                {color.frequency} item{color.frequency !== 1 ? 's' : ''}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Brand Affinity */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#00132d] mb-4">
          Brand Affinity
        </h3>
        <div className="space-y-3">
          {data.brandAffinity.slice(0, 5).map((brand, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between p-4 bg-[#00132d]/5 rounded-xl hover:bg-[#00132d]/10 transition-all duration-300 border border-[#00132d]/20 hover:border-[#00132d]/40 hover:shadow-md">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#fff7d7] rounded-full shadow-sm group-hover:shadow-md transition-shadow border border-[#00132d]/10">
                    <span className="text-lg font-bold text-[#00132d]">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#00132d] group-hover:text-[#00132d]/80 transition-colors">
                      {brand.brand}
                    </p>
                    <p className="text-sm text-[#00132d]/60">
                      {brand.itemCount} item{brand.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#00132d] text-lg">
                    ${brand.totalValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#00132d]/60">total investment</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Style Evolution */}
      <div>
        <h3 className="text-lg font-semibold text-[#00132d] mb-4">
          Style Evolution Timeline
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#00132d]"></div>
          
          <div className="space-y-6">
            {data.styleEvolution.map((period, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="relative flex items-center space-x-4"
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-[#fff7d7] border-4 border-[#00132d] rounded-full shadow-lg">
                  <div className="w-4 h-4 bg-[#00132d] rounded-full"></div>
                </div>
                
                {/* Content */}
                <div className="flex-1 bg-[#fff7d7] p-4 rounded-xl shadow-md border border-[#00132d]/20 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#00132d] text-lg">{period.period}</p>
                      <p className="text-[#00132d]/80 font-medium">{period.dominantStyle}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#00132d]/20 rounded-full h-2">
                          <motion.div 
                            className="bg-[#00132d] h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${period.confidence}%` }}
                            transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#00132d]">{period.confidence}%</span>
                      </div>
                      <p className="text-xs text-[#00132d]/60 mt-1">confidence</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t border-[#00132d]/20">
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#00132d] text-[#fff7d7] px-6 py-3 rounded-xl font-semibold hover:bg-[#00132d]/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Get Style Recommendations
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#fff7d7] border-2 border-[#00132d] text-[#00132d] px-6 py-3 rounded-xl font-semibold hover:bg-[#00132d]/5 transition-all duration-300"
          >
            Download Report
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}