// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'pie' | 'donut';
  title?: string;
  height?: number;
  animated?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export default function InteractiveChart({
  data,
  type,
  title,
  height = 200,
  animated = true,
  showTooltip = true,
  className = ''
}: InteractiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValues(data.map(d => d.value));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValues(data.map(d => d.value));
    }
  }, [data, animated]);

  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const getDefaultColor = (index: number) => {
    const colors = [
      '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
      '#EF4444', '#EC4899', '#6366F1', '#84CC16'
    ];
    return colors[index % colors.length];
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '';
    }
  };

  const renderBarChart = () => (
    <div className="flex items-end justify-between space-x-2" style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (animatedValues[index] / maxValue) * (height - 40);
        const isHovered = hoveredIndex === index;

        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="relative flex-1 flex items-end">
              <motion.div
                className={`w-full rounded-t-lg cursor-pointer transition-all duration-300 ${isHovered ? 'shadow-lg transform scale-105' : ''
                  }`}
                style={{
                  backgroundColor: item.color || getDefaultColor(index),
                  opacity: isHovered ? 1 : 0.8
                }}
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: animated ? 0.8 : 0, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-10"
                  >
                    {item.label}: {item.value}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-2 text-xs text-gray-600 text-center">
              <div className="font-medium">{item.label}</div>
              {item.trend && (
                <div className="mt-1">{getTrendIcon(item.trend)}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (animatedValues[index] / maxValue) * 80;
      return { x, y, ...item, index };
    });

    return (
      <div className="relative" style={{ height }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#f3f4f6"
              strokeWidth="0.2"
            />
          ))}

          {/* Line path */}
          <motion.path
            d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="0.8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: animated ? 1.5 : 0 }}
          />

          {/* Area fill */}
          <motion.path
            d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')} L 100,100 L 0,100 Z`}
            fill="url(#gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: animated ? 1 : 0, delay: 0.5 }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? "1.5" : "1"}
              fill="#8B5CF6"
              className="cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: animated ? 0.5 : 0, delay: index * 0.1 + 0.5 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600">
          {data.map((item, index) => (
            <span key={index} className="text-center">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderDonutChart = () => {
    const radius = 45;
    const centerX = 50;
    const centerY = 50;
    let cumulativePercentage = 0;

    return (
      <div className="relative flex items-center justify-center" style={{ height }}>
        <svg className="w-full h-full max-w-xs" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360;

            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);

            const largeArcFlag = percentage > 50 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            cumulativePercentage += percentage;

            return (
              <motion.path
                key={index}
                d={pathData}
                fill={item.color || getDefaultColor(index)}
                className="cursor-pointer transition-all duration-300"
                style={{
                  opacity: hoveredIndex === index ? 1 : 0.8,
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: '50% 50%'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredIndex === index ? 1 : 0.8 }}
                transition={{ duration: animated ? 0.5 : 0, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {/* Center circle for donut effect */}
          <circle
            cx={centerX}
            cy={centerY}
            r="20"
            fill="white"
          />

          {/* Center text */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-semibold fill-gray-700"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-500"
          >
            {total}
          </text>
        </svg>

        {/* Legend */}
        <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 ml-4 space-y-2">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 cursor-pointer transition-all duration-300 ${hoveredIndex === index ? 'transform scale-105' : ''
                }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || getDefaultColor(index) }}
              />
              <span className="text-xs text-gray-700">{item.label}</span>
              <span className="text-xs text-gray-500">
                ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
      case 'donut':
        return renderDonutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}

      <div className="relative">
        {renderChart()}
      </div>

      {/* Hover info */}
      <AnimatePresence>
        {hoveredIndex !== null && showTooltip && type !== 'bar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {data[hoveredIndex].label}
              </span>
              <span className="text-gray-600">
                {data[hoveredIndex].value}
                {data[hoveredIndex].trend && (
                  <span className="ml-2">{getTrendIcon(data[hoveredIndex].trend)}</span>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}