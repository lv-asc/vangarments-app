'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  XMarkIcon, 
  PhotoIcon, 
  CloudArrowUpIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (images: File[], itemData: any) => Promise<void>;
}

export function AddItemModal({ isOpen, onClose, onSubmit }: AddItemModalProps) {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [itemData, setItemData] = useState({
    name: '',
    category: '',
    brand: '',
    color: '',
    size: '',
    condition: 'excellent',
    purchasePrice: '',
    purchaseDate: '',
    description: '',
    useAI: true,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Convert form data to API format
      const apiItemData = {
        category: itemData.category ? {
          page: mapCategoryToPage(itemData.category),
          whiteSubcategory: itemData.category,
        } : undefined,
        brand: itemData.brand ? { brand: itemData.brand } : undefined,
        metadata: {
          colors: itemData.color ? [{ primary: itemData.color, undertones: [] }] : undefined,
          acquisitionInfo: itemData.purchasePrice ? {
            date: itemData.purchaseDate || new Date().toISOString(),
            price: parseFloat(itemData.purchasePrice),
            store: 'Manual Entry',
          } : undefined,
        },
        condition: {
          status: mapConditionToAPI(itemData.condition),
          defects: [],
        },
        ownership: {
          status: 'owned' as const,
          visibility: 'public' as const,
        },
        useAI: itemData.useAI,
      };

      await onSubmit(images, apiItemData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create item:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setImages([]);
    setAiSuggestions(null);
    setItemData({
      name: '',
      category: '',
      brand: '',
      color: '',
      size: '',
      condition: 'excellent',
      purchasePrice: '',
      purchaseDate: '',
      description: '',
      useAI: true,
    });
  };

  const mapCategoryToPage = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'tops': 'Apparel',
      'bottoms': 'Apparel',
      'dresses': 'Apparel',
      'shoes': 'Footwear',
      'accessories': 'Apparel',
      'outerwear': 'Apparel',
    };
    return categoryMap[category] || 'Apparel';
  };

  const mapConditionToAPI = (condition: string): 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor' => {
    const conditionMap: Record<string, 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor'> = {
      'new': 'New',
      'excellent': 'Excellent Used',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
    };
    return conditionMap[condition] || 'Good';
  };

  const categories = [
    { value: 'tops', label: 'Blusas e Camisetas' },
    { value: 'bottoms', label: 'Calças e Saias' },
    { value: 'dresses', label: 'Vestidos' },
    { value: 'shoes', label: 'Calçados' },
    { value: 'accessories', label: 'Acessórios' },
    { value: 'outerwear', label: 'Casacos e Jaquetas' },
  ];

  const conditions = [
    { value: 'new', label: 'Novo com etiqueta' },
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bom' },
    { value: 'fair', label: 'Regular' },
    { value: 'poor', label: 'Desgastado' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Adicionar Nova Peça
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Passo {step} de 2
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Adicionar Fotos
                      </h3>
                      
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragActive
                            ? 'border-[#00132d] bg-[#fff7d7]'
                            : 'border-gray-300 hover:border-[#00132d] hover:bg-[#fff7d7]'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          {isDragActive ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para selecionar'}
                        </p>
                        <p className="text-sm text-gray-600">
                          PNG, JPG, WEBP até 10MB (máximo 5 fotos)
                        </p>
                      </div>

                      {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {images.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <SparklesIcon className="h-5 w-5 text-blue-500 mr-3" />
                          <p className="text-sm text-blue-700">
                            Nossa IA irá analisar as fotos e preencher automaticamente as informações da peça!
                          </p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={itemData.useAI}
                            onChange={(e) => setItemData(prev => ({ ...prev, useAI: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm text-blue-700">Usar IA</span>
                        </label>
                      </div>

                      {aiSuggestions && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 mb-2">
                            Sugestões da IA:
                          </h4>
                          <div className="text-sm text-green-700 space-y-1">
                            {aiSuggestions.category && (
                              <p>Categoria: {aiSuggestions.category.whiteSubcategory}</p>
                            )}
                            {aiSuggestions.brand && (
                              <p>Marca: {aiSuggestions.brand.brand}</p>
                            )}
                            {aiSuggestions.metadata?.colors?.[0] && (
                              <p>Cor: {aiSuggestions.metadata.colors[0].primary}</p>
                            )}
                            <p className="text-xs">
                              Confiança: {aiSuggestions.confidence?.overall || 0}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da Peça *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={itemData.name}
                          onChange={handleInputChange}
                          className="fashion-input"
                          placeholder="Ex: Blusa branca básica"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria *
                        </label>
                        <select
                          name="category"
                          value={itemData.category}
                          onChange={handleInputChange}
                          className="fashion-input"
                          required
                        >
                          <option value="">Selecione uma categoria</option>
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marca
                        </label>
                        <input
                          type="text"
                          name="brand"
                          value={itemData.brand}
                          onChange={handleInputChange}
                          className="fashion-input"
                          placeholder="Ex: Zara, H&M, Farm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Principal
                        </label>
                        <input
                          type="text"
                          name="color"
                          value={itemData.color}
                          onChange={handleInputChange}
                          className="fashion-input"
                          placeholder="Ex: Branco, Azul marinho"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tamanho
                        </label>
                        <input
                          type="text"
                          name="size"
                          value={itemData.size}
                          onChange={handleInputChange}
                          className="fashion-input"
                          placeholder="Ex: M, 38, 40"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condição
                        </label>
                        <select
                          name="condition"
                          value={itemData.condition}
                          onChange={handleInputChange}
                          className="fashion-input"
                        >
                          {conditions.map(condition => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preço Pago (R$)
                        </label>
                        <input
                          type="number"
                          name="purchasePrice"
                          value={itemData.purchasePrice}
                          onChange={handleInputChange}
                          className="fashion-input"
                          placeholder="0,00"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data da Compra
                        </label>
                        <input
                          type="date"
                          name="purchaseDate"
                          value={itemData.purchaseDate}
                          onChange={handleInputChange}
                          className="fashion-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição (Opcional)
                      </label>
                      <textarea
                        name="description"
                        value={itemData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="fashion-input"
                        placeholder="Adicione detalhes sobre a peça, ocasiões de uso, etc."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  
                  {step === 1 ? (
                    <Button
                      onClick={() => setStep(2)}
                      disabled={images.length === 0}
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || (!itemData.name && !itemData.useAI) || !itemData.category}
                    >
                      {loading ? 'Processando...' : 'Adicionar Peça'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}