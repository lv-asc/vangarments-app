// @ts-nocheck
'use client';

import { useState, useRef } from 'react';
import {
  XMarkIcon,
  PhotoIcon,
  TagIcon,
  MapPinIcon,
  EyeIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { VUFSItem, OutfitCombination } from '@vangarments/shared';

interface OutfitShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit?: OutfitCombination;
  wardrobeItems: VUFSItem[];
  onShare: (shareData: OutfitShareData) => Promise<void>;
}

export interface OutfitShareData {
  title: string;
  description: string;
  images: File[];
  wardrobeItemIds: string[];
  tags: string[];
  location?: string;
  visibility: 'public' | 'followers' | 'private';
  whereToBuy: WhereToBuyInfo[];
}

interface WhereToBuyInfo {
  itemId: string;
  storeName?: string;
  storeUrl?: string;
  price?: number;
  availability: 'available' | 'out_of_stock' | 'limited';
}

export function OutfitShareModal({
  isOpen,
  onClose,
  outfit,
  wardrobeItems,
  onShare
}: OutfitShareModalProps) {
  const [title, setTitle] = useState(outfit?.name || '');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    outfit?.items.map(item => item.id) || []
  );
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [whereToBuy, setWhereToBuy] = useState<WhereToBuyInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const updateWhereToBuy = (itemId: string, info: Partial<WhereToBuyInfo>) => {
    setWhereToBuy(prev => {
      const existing = prev.find(item => item.itemId === itemId);
      if (existing) {
        return prev.map(item =>
          item.itemId === itemId ? { ...item, ...info } : item
        );
      } else {
        return [...prev, { itemId, availability: 'available', ...info }];
      }
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || images.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onShare({
        title: title.trim(),
        description: description.trim(),
        images,
        wardrobeItemIds: selectedItems,
        tags,
        location: location.trim() || undefined,
        visibility,
        whereToBuy
      });
      onClose();
    } catch (error) {
      console.error('Failed to share outfit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Público', icon: GlobeAltIcon, description: 'Visível para todos' },
    { value: 'followers', label: 'Seguidores', icon: UserGroupIcon, description: 'Apenas seguidores' },
    { value: 'private', label: 'Privado', icon: LockClosedIcon, description: 'Apenas você' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Compartilhar Look
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Look *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Look perfeito para o trabalho"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos do Look *
            </label>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Look ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Adicionar fotos ({images.length}/5)
                  </p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte sobre o look, ocasião, inspiração..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 caracteres
            </p>
          </div>

          {/* Wardrobe Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peças do Guarda-roupa
            </label>
            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto">
              {wardrobeItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedItems.includes(item.id)
                      ? 'border-pink-500 ring-2 ring-pink-200'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <img
                    src={item.images[0]?.url || '/api/placeholder/100/100'}
                    alt={item.metadata.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedItems.includes(item.id) && (
                    <div className="absolute inset-0 bg-pink-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-pink-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Where to Buy */}
          {selectedItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ShoppingBagIcon className="h-4 w-4 inline mr-1" />
                Onde Comprar
              </label>
              <div className="space-y-3">
                {selectedItems.map((itemId) => {
                  const item = wardrobeItems.find(i => i.id === itemId);
                  if (!item) return null;

                  const buyInfo = whereToBuy.find(info => info.itemId === itemId);

                  return (
                    <div key={itemId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={item.images[0]?.url || '/api/placeholder/40/40'}
                          alt={item.metadata.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {item.metadata.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Nome da loja"
                          value={buyInfo?.storeName || ''}
                          onChange={(e) => updateWhereToBuy(itemId, { storeName: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                        <input
                          type="url"
                          placeholder="Link da loja"
                          value={buyInfo?.storeUrl || ''}
                          onChange={(e) => updateWhereToBuy(itemId, { storeUrl: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-800"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-pink-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Adicionar tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Localização
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: São Paulo, SP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <EyeIcon className="h-4 w-4 inline mr-1" />
              Visibilidade
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <option.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || images.length === 0 || isSubmitting}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Compartilhando...' : 'Compartilhar'}
          </button>
        </div>
      </div>
    </div>
  );
}