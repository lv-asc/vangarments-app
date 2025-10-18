'use client';

import React, { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { 
  PhotoIcon, 
  XMarkIcon,
  TagIcon,
  EyeIcon,
  UserGroupIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export default function CreatePostPage() {
  const [postType, setPostType] = useState<'outfit' | 'item' | 'inspiration'>('outfit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newImages = [...images, ...files].slice(0, 5); // Max 5 images
    setImages(newImages);

    // Create previews
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setImagePreviews([...newPreviews].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 10) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      alert('Adicione pelo menos uma imagem');
      return;
    }

    if (!title.trim()) {
      alert('Adicione um título para seu post');
      return;
    }

    setIsSubmitting(true);

    try {
      // First upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('image', image);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrls.push(uploadData.url);
        } else {
          // Fallback to placeholder for demo
          imageUrls.push('/api/placeholder/400/600');
        }
      }

      // Create the post
      const postData = {
        postType,
        content: {
          title: title.trim(),
          description: description.trim() || undefined,
          imageUrls,
          tags: tags.length > 0 ? tags : undefined
        },
        visibility
      };

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        // Success! Redirect to social feed
        window.location.href = '/social';
      } else {
        const errorData = await response.json();
        alert(`Erro ao criar post: ${errorData.error?.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erro ao criar post. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case 'outfit':
        return {
          label: 'Look Completo',
          description: 'Compartilhe um look completo com várias peças',
          placeholder: 'Ex: Look perfeito para o trabalho'
        };
      case 'item':
        return {
          label: 'Peça Individual',
          description: 'Destaque uma peça específica do seu guarda-roupa',
          placeholder: 'Ex: Blazer vintage incrível'
        };
      case 'inspiration':
        return {
          label: 'Inspiração',
          description: 'Compartilhe ideias, cores ou tendências',
          placeholder: 'Ex: Paleta de cores para o verão'
        };
      default:
        return { label: type, description: '', placeholder: '' };
    }
  };

  const getVisibilityInfo = (vis: string) => {
    switch (vis) {
      case 'public':
        return { icon: EyeIcon, label: 'Público', description: 'Todos podem ver' };
      case 'followers':
        return { icon: UserGroupIcon, label: 'Seguidores', description: 'Apenas quem te segue' };
      case 'private':
        return { icon: LockClosedIcon, label: 'Privado', description: 'Apenas você' };
      default:
        return { icon: EyeIcon, label: vis, description: '' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Post</h1>
          <p className="text-gray-600">Compartilhe seus looks e inspirações com a comunidade</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Post Type Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Post</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['outfit', 'item', 'inspiration'] as const).map((type) => {
                const info = getPostTypeInfo(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      postType === type
                        ? 'border-[#00132d] bg-[#00132d]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{info.label}</h3>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagens</h2>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer transition-colors"
            >
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {images.length === 0 ? 'Adicione suas fotos' : `${images.length}/5 imagens adicionadas`}
              </p>
              <p className="text-sm text-gray-500">
                Clique para selecionar ou arraste arquivos aqui
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Post Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conteúdo</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={getPostTypeInfo(postType).placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte mais sobre seu post..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-[#00132d] text-white text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-white hover:text-gray-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Adicionar tag..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                />
              </div>
              <Button type="button" onClick={addTag} variant="outline">
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Máximo de 10 tags. Pressione Enter ou clique em Adicionar.
            </p>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibilidade</h2>
            <div className="space-y-3">
              {(['public', 'followers', 'private'] as const).map((vis) => {
                const info = getVisibilityInfo(vis);
                const Icon = info.icon;
                return (
                  <label key={vis} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={vis}
                      checked={visibility === vis}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="text-[#00132d] focus:ring-[#00132d]"
                    />
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">{info.label}</span>
                      <span className="text-sm text-gray-500 ml-2">{info.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/social'}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || images.length === 0 || !title.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Publicando...' : 'Publicar Post'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}