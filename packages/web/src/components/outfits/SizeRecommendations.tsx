'use client';

import { useState, useEffect } from 'react';
import { 
  InformationCircleIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

interface SizeRecommendationsProps {
  items: any[];
}

interface SizeRecommendation {
  itemId: string;
  itemName: string;
  currentSize?: string;
  recommendedSize: string;
  confidence: number;
  fitPrediction: 'too_small' | 'perfect' | 'slightly_loose' | 'too_large';
  reasoning: string;
  alternatives?: string[];
}

export function SizeRecommendations({ items }: SizeRecommendationsProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<SizeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length > 0 && user) {
      generateRecommendations();
    }
  }, [items, user]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll generate mock recommendations
      const mockRecommendations = items
        .filter(item => item.size && ['tops', 'bottoms', 'dresses', 'shoes'].includes(item.category))
        .map(item => generateMockRecommendation(item));
      
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Failed to generate size recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecommendation = (item: any): SizeRecommendation => {
    // Mock logic for size recommendations
    const currentSize = item.size;
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    // Simple size mapping for demonstration
    const sizeMap: Record<string, string[]> = {
      'PP': ['PP', 'P'],
      'P': ['PP', 'P', 'M'],
      'M': ['P', 'M', 'G'],
      'G': ['M', 'G', 'GG'],
      'GG': ['G', 'GG'],
    };

    const alternatives = sizeMap[currentSize] || [currentSize];
    const fitPredictions: Array<'too_small' | 'perfect' | 'slightly_loose' | 'too_large'> = 
      ['perfect', 'slightly_loose', 'perfect', 'perfect'];
    const fitPrediction = fitPredictions[Math.floor(Math.random() * fitPredictions.length)];

    let reasoning = '';
    switch (fitPrediction) {
      case 'perfect':
        reasoning = 'Baseado nas suas medidas, este tamanho deve servir perfeitamente.';
        break;
      case 'slightly_loose':
        reasoning = 'Pode ficar um pouco folgado, mas ainda assim confortável.';
        break;
      case 'too_small':
        reasoning = 'Pode ficar apertado. Considere um tamanho maior.';
        break;
      case 'too_large':
        reasoning = 'Pode ficar muito largo. Considere um tamanho menor.';
        break;
    }

    return {
      itemId: item.id,
      itemName: item.name,
      currentSize,
      recommendedSize: currentSize,
      confidence,
      fitPrediction,
      reasoning,
      alternatives: alternatives.filter(size => size !== currentSize),
    };
  };

  const getFitIcon = (fitPrediction: string) => {
    switch (fitPrediction) {
      case 'perfect':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'slightly_loose':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'too_small':
      case 'too_large':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFitColor = (fitPrediction: string) => {
    switch (fitPrediction) {
      case 'perfect':
        return 'border-green-200 bg-green-50';
      case 'slightly_loose':
        return 'border-blue-200 bg-blue-50';
      case 'too_small':
      case 'too_large':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getFitLabel = (fitPrediction: string) => {
    const labels = {
      perfect: 'Tamanho Ideal',
      slightly_loose: 'Levemente Folgado',
      too_small: 'Muito Pequeno',
      too_large: 'Muito Grande',
    };
    return labels[fitPrediction as keyof typeof labels] || 'Desconhecido';
  };

  if (!user?.measurements) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Recomendações de Tamanho
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Complete suas medidas no perfil para receber recomendações personalizadas de tamanho.
            </p>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Adicionar Medidas
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <InformationCircleIcon className="w-5 h-5 text-gray-500" />
        <h4 className="font-medium text-gray-900">
          Recomendações de Tamanho
        </h4>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.itemId}
              className={`border rounded-lg p-4 ${getFitColor(rec.fitPrediction)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={items.find(item => item.id === rec.itemId)?.images?.[0] || '/api/placeholder/300/400'}
                    alt={rec.itemName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {getFitIcon(rec.fitPrediction)}
                    <h5 className="font-medium text-gray-900 truncate">
                      {rec.itemName}
                    </h5>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Tamanho atual:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {rec.currentSize}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Recomendado:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {rec.recommendedSize}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Ajuste:</span>
                      <span className={`text-sm font-medium ${
                        rec.fitPrediction === 'perfect' ? 'text-green-700' :
                        rec.fitPrediction === 'slightly_loose' ? 'text-blue-700' :
                        'text-yellow-700'
                      }`}>
                        {getFitLabel(rec.fitPrediction)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Confiança:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {rec.confidence}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {rec.reasoning}
                  </p>
                  
                  {rec.alternatives && rec.alternatives.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 mr-2">
                        Alternativas:
                      </span>
                      <div className="inline-flex space-x-1">
                        {rec.alternatives.map((size) => (
                          <span
                            key={size}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-gray-300 text-gray-700"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <strong>Nota:</strong> As recomendações são baseadas nas suas medidas e no histórico de tamanhos das marcas. 
          Sempre verifique a tabela de medidas específica de cada marca antes de comprar.
        </p>
      </div>
    </div>
  );
}