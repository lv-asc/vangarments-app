// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CameraIcon, LockClosedIcon, GlobeAltIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: '',
    location: {
      city: '',
      state: '',
      country: 'Brasil'
    },
    socialLinks: {
      instagram: '',
      tiktok: '',
      website: ''
    }
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    isPrivate: false,
    wardrobe: { visibility: 'public' as 'public' | 'followers' | 'custom' | 'hidden', exceptUsers: [] as string[] },
    activity: { visibility: 'public' as 'public' | 'followers' | 'custom' | 'hidden', exceptUsers: [] as string[] },
    outfits: { visibility: 'public' as 'public' | 'followers' | 'custom' | 'hidden', exceptUsers: [] as string[] },
    marketplace: { visibility: 'public' as 'public' | 'followers' | 'custom' | 'hidden', exceptUsers: [] as string[] }
  });

  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);

  // Load user's current privacy settings
  useEffect(() => {
    if (user?.privacySettings) {
      setPrivacySettings(prev => ({
        ...prev,
        isPrivate: user.privacySettings?.isPrivate || false,
        wardrobe: user.privacySettings?.wardrobe || prev.wardrobe,
        activity: user.privacySettings?.activity || prev.activity,
        outfits: user.privacySettings?.outfits || prev.outfits,
        marketplace: user.privacySettings?.marketplace || prev.marketplace
      }));
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In development mode, just update the mock user data
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 DEV: Updating profile', formData);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update local storage with new data
        const currentUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
        const updatedUser = {
          ...currentUser,
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          socialLinks: formData.socialLinks,
          avatar: profileImagePreview || currentUser.avatar,
          updatedAt: new Date()
        };

        localStorage.setItem('mockUser', JSON.stringify(updatedUser));

        // Trigger a page refresh to show changes
        window.location.reload();
      } else {
        // Production mode - use real API
        await updateProfile({
          name: formData.name,
          personalInfo: {
            ...user?.personalInfo,
            location: formData.location
          },
          preferences: {
            ...user?.preferences,
            bio: formData.bio,
            socialLinks: formData.socialLinks
          }
        });

        // Update privacy settings
        await apiClient.updatePrivacySettings(privacySettings);
      }

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Público' },
    { value: 'followers', label: 'Apenas Seguidores' },
    { value: 'custom', label: 'Personalizado (Lista)' },
    { value: 'hidden', label: 'Oculto' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={profileImagePreview || user?.avatar || "/api/placeholder/120/120"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-[#00132d] text-[#fff7d7] p-1.5 rounded-full shadow-lg hover:bg-[#00132d]/90 transition-colors cursor-pointer">
                <CameraIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Foto do Perfil</h3>
              <p className="text-sm text-gray-600">Recomendado: 320x320px</p>
              <label className="mt-2 cursor-pointer">
                <Button type="button" variant="outline" size="sm" as="span">
                  Alterar Foto
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio (máx. 160 caracteres)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent resize-none"
                placeholder="Conte um pouco sobre você e seu estilo..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/160 caracteres
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Localização</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="BA">Bahia</option>
                  <option value="GO">Goiás</option>
                  <option value="PE">Pernambuco</option>
                  <option value="CE">Ceará</option>
                </select>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Redes Sociais</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                    placeholder="seuusuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TikTok
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.socialLinks.tiktok}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                    placeholder="seuusuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, website: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                  placeholder="https://seusite.com"
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5" />
                Privacidade
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showPrivacyDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                {showPrivacyDetails ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
            </div>

            {/* Account Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {privacySettings.isPrivate ? (
                    <><LockClosedIcon className="h-4 w-4" /> Conta Privada</>
                  ) : (
                    <><GlobeAltIcon className="h-4 w-4" /> Conta Pública</>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {privacySettings.isPrivate
                    ? 'Usuários precisam solicitar para seguir você'
                    : 'Qualquer pessoa pode seguir você'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrivacySettings(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.isPrivate ? 'bg-[#00132d]' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {/* Feature Visibility Controls */}
            {showPrivacyDetails && (
              <div className="space-y-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Controle quem pode ver cada seção do seu perfil:</p>

                {[
                  { id: 'wardrobe', label: 'Guarda-roupa' },
                  { id: 'activity', label: 'Atividade' },
                  { id: 'outfits', label: 'Looks' },
                  { id: 'marketplace', label: 'Marketplace' }
                ].map((feature) => (
                  <div key={feature.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">{feature.label}</label>
                      <select
                        value={(privacySettings as any)[feature.id].visibility}
                        onChange={(e) => setPrivacySettings(prev => ({
                          ...prev,
                          [feature.id]: { ...(prev as any)[feature.id], visibility: e.target.value as any }
                        }))}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00132d] focus:border-transparent"
                      >
                        {visibilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {(privacySettings as any)[feature.id].visibility === 'custom' && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                        <p className="text-[10px] text-gray-500 mb-1 uppercase font-bold">IDs de Usuários ou Usernames</p>
                        <textarea
                          placeholder="Ex: lv, joao, maria (um por linha ou vírgula)"
                          value={(privacySettings as any)[feature.id].exceptUsers?.join(', ') || ''}
                          onChange={(e) => {
                            const list = e.target.value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
                            setPrivacySettings(prev => ({
                              ...prev,
                              [feature.id]: { ...(prev as any)[feature.id], exceptUsers: list }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs min-h-[60px]"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}