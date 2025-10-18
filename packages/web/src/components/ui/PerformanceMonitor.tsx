'use client';

import React, { useEffect, useState } from 'react';
import { usePerformance } from '@/hooks/usePerformance';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  onSlowPerformance?: (metrics: any) => void;
}

export function PerformanceMonitor({ showDetails = false, onSlowPerformance }: PerformanceMonitorProps) {
  const {
    metrics,
    networkInfo,
    isSlowConnection,
    shouldReduceAnimations,
    shouldOptimizeImages,
    sendMetrics,
  } = usePerformance();

  const [showWarning, setShowWarning] = useState(false);
  const [performanceIssues, setPerformanceIssues] = useState<string[]>([]);

  useEffect(() => {
    const issues: string[] = [];

    // Check for performance issues
    if (metrics.lcp && metrics.lcp > 2500) {
      issues.push('Carregamento lento da página');
    }

    if (metrics.fid && metrics.fid > 100) {
      issues.push('Resposta lenta à interação');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      issues.push('Layout instável');
    }

    if (isSlowConnection) {
      issues.push('Conexão lenta detectada');
    }

    setPerformanceIssues(issues);
    setShowWarning(issues.length > 0);

    // Notify parent component of performance issues
    if (issues.length > 0 && onSlowPerformance) {
      onSlowPerformance({ metrics, networkInfo, issues });
    }

    // Send metrics to backend for monitoring
    if (metrics.lcp || metrics.fcp) {
      sendMetrics();
    }
  }, [metrics, isSlowConnection, networkInfo, onSlowPerformance, sendMetrics]);

  // Auto-hide warning after 10 seconds
  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => setShowWarning(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  const getPerformanceScore = () => {
    let score = 100;
    
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;
    }
    
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 25;
      else if (metrics.fid > 100) score -= 10;
    }
    
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 25;
      else if (metrics.cls > 0.1) score -= 10;
    }
    
    if (isSlowConnection) score -= 20;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${Math.round(value)}${unit}`;
  };

  if (!showDetails && !showWarning) return null;

  return (
    <>
      {/* Performance Warning */}
      {showWarning && !showDetails && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Performance Reduzida
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    {performanceIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
                {shouldReduceAnimations && (
                  <div className="mt-2 text-xs text-yellow-600">
                    Animações foram reduzidas para melhorar a performance.
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="flex-shrink-0 ml-2 text-yellow-400 hover:text-yellow-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Performance Panel */}
      {showDetails && (
        <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-xl border p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Performance Monitor
            </h3>
            <div className={`text-lg font-bold ${getScoreColor(getPerformanceScore())}`}>
              {getPerformanceScore()}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* Core Web Vitals */}
            <div>
              <div className="font-medium text-gray-700 mb-1">Core Web Vitals</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-1">
                  <div className="text-gray-500">LCP</div>
                  <div className={metrics.lcp && metrics.lcp > 2500 ? 'text-red-600' : 'text-green-600'}>
                    {formatMetric(metrics.lcp)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-1">
                  <div className="text-gray-500">FID</div>
                  <div className={metrics.fid && metrics.fid > 100 ? 'text-red-600' : 'text-green-600'}>
                    {formatMetric(metrics.fid)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-1">
                  <div className="text-gray-500">CLS</div>
                  <div className={metrics.cls && metrics.cls > 0.1 ? 'text-red-600' : 'text-green-600'}>
                    {formatMetric(metrics.cls, '')}
                  </div>
                </div>
              </div>
            </div>

            {/* Network Info */}
            {networkInfo && (
              <div>
                <div className="font-medium text-gray-700 mb-1">Conexão</div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className={isSlowConnection ? 'text-red-600' : 'text-green-600'}>
                      {networkInfo.effectiveType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Velocidade:</span>
                    <span>{networkInfo.downlink} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RTT:</span>
                    <span>{networkInfo.rtt}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Optimizations */}
            {(shouldReduceAnimations || shouldOptimizeImages) && (
              <div>
                <div className="font-medium text-gray-700 mb-1">Otimizações Ativas</div>
                <div className="bg-blue-50 rounded p-2 text-blue-700">
                  {shouldReduceAnimations && <div>• Animações reduzidas</div>}
                  {shouldOptimizeImages && <div>• Imagens otimizadas</div>}
                </div>
              </div>
            )}

            {/* Performance Issues */}
            {performanceIssues.length > 0 && (
              <div>
                <div className="font-medium text-gray-700 mb-1">Problemas Detectados</div>
                <div className="bg-red-50 rounded p-2 text-red-700">
                  {performanceIssues.map((issue, index) => (
                    <div key={index}>• {issue}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t text-xs text-gray-500">
            Monitoramento em tempo real
          </div>
        </div>
      )}
    </>
  );
}