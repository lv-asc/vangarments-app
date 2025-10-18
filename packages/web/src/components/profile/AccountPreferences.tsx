'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/flags';
import { XIcon } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { 
  BellIcon, 
  GlobeAltIcon, 
  CurrencyDollarIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface AccountPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountPreferences({ isOpen, onClose }: AccountPreferencesProps) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [preferences, setPreferences] = useState({
    language: user?.preferences?.language ?? 'pt-BR',
    currency: user?.preferences?.currency ?? 'BRL',
    theme: user?.preferences?.theme ?? 'light',
    notifications: {
      newFollowers: user?.preferences?.notifications?.newFollowers ?? true,
      likes: user?.preferences?.notifications?.likes ?? true,
      comments: user?.preferences?.notifications?.comments ?? true,
      mentions: user?.preferences?.notifications?.mentions ?? true,
      marketplaceActivity: user?.preferences?.notifications?.marketplaceActivity ?? true,
      outfitSuggestions: user?.preferences?.notifications?.outfitSuggestions ?? false,
      trendAlerts: user?.preferences?.notifications?.trendAlerts ?? false,
      priceDrops: user?.preferences?.notifications?.priceDrops ?? true,
      weeklyDigest: user?.preferences?.notifications?.weeklyDigest ?? true
    },
    display: {
      itemsPerPage: user?.preferences?.display?.itemsPerPage ?? 20,
      defaultView: user?.preferences?.display?.defaultView ?? 'grid',
      showPrices: user?.preferences?.display?.showPrices ?? true,
      showBrands: user?.preferences?.display?.showBrands ?? true,
      compactMode: user?.preferences?.display?.compactMode ?? false
    },
    ai: {
      autoTagging: user?.preferences?.ai?.autoTagging ?? true,
      backgroundRemoval: user?.preferences?.ai?.backgroundRemoval ?? true,
      outfitSuggestions: user?.preferences?.ai?.outfitSuggestions ?? true,
      styleAnalysis: user?.preferences?.ai?.styleAnalysis ?? true,
      confidenceThreshold: user?.preferences?.ai?.confidenceThreshold ?? 0.7
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        preferences: {
          ...user?.preferences,
          ...preferences
        }
      });
      onClose();
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: 'BR' },
    { code: 'en-US', name: 'English (US)', flag: 'US' },
    { code: 'es-ES', name: 'Español', flag: 'ES' },
    { code: 'fr-FR', name: 'Français', flag: 'FR' }
  ];

  const currencies = [
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
  ];

  const themes = [
    { value: 'light', name: 'Claro' },
    { value: 'dark', name: 'Escuro' },
    { value: 'auto', name: 'Automático' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Preferências da Conta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* General Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Configurações Gerais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    language: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moeda
                </label>
                <select
                  value={preferences.currency}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    currency: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema
              </label>
              <div className="flex space-x-3">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setPreferences({
                      ...preferences,
                      theme: theme.value
                    })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                      preferences.theme === theme.value
                        ? 'bg-pink-50 border-pink-200 text-pink-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{theme.icon}</span>
                    <span className="text-sm font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Notificações</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'newFollowers', label: 'Novos Seguidores', description: 'Quando alguém começar a te seguir' },
                { key: 'likes', label: 'Curtidas', description: 'Quando alguém curtir seus posts' },
                { key: 'comments', label: 'Comentários', description: 'Quando alguém comentar em seus posts' },
                { key: 'mentions', label: 'Menções', description: 'Quando alguém te mencionar' },
                { key: 'marketplaceActivity', label: 'Atividade do Marketplace', description: 'Vendas, compras e ofertas' },
                { key: 'outfitSuggestions', label: 'Sugestões de Looks', description: 'Recomendações personalizadas de outfits' },
                { key: 'trendAlerts', label: 'Alertas de Tendências', description: 'Novas tendências baseadas no seu estilo' },
                { key: 'priceDrops', label: 'Quedas de Preço', description: 'Quando itens da sua wishlist ficarem mais baratos' },
                { key: 'weeklyDigest', label: 'Resumo Semanal', description: 'Resumo das suas atividades e estatísticas' }
              ].map((notification) => (
                <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{notification.label}</div>
                    <div className="text-sm text-gray-600">{notification.description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notifications[notification.key as keyof typeof preferences.notifications]}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        [notification.key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Exibição</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Itens por Página
                </label>
                <select
                  value={preferences.display.itemsPerPage}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    display: { ...preferences.display, itemsPerPage: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value={10}>10 itens</option>
                  <option value={20}>20 itens</option>
                  <option value={50}>50 itens</option>
                  <option value={100}>100 itens</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visualização Padrão
                </label>
                <select
                  value={preferences.display.defaultView}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    display: { ...preferences.display, defaultView: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="grid">Grade</option>
                  <option value="list">Lista</option>
                  <option value="masonry">Mosaico</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'showPrices', label: 'Mostrar Preços', description: 'Exibir preços dos itens quando disponível' },
                { key: 'showBrands', label: 'Mostrar Marcas', description: 'Exibir nomes das marcas nos itens' },
                { key: 'compactMode', label: 'Modo Compacto', description: 'Interface mais densa com menos espaçamento' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{setting.label}</div>
                    <div className="text-sm text-gray-600">{setting.description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.display[setting.key as keyof typeof preferences.display]}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      display: {
                        ...preferences.display,
                        [setting.key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <PaintBrushIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Inteligência Artificial</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'autoTagging', label: 'Marcação Automática', description: 'Detectar automaticamente categorias e marcas nas fotos' },
                { key: 'backgroundRemoval', label: 'Remoção de Fundo', description: 'Remover automaticamente o fundo das fotos de roupas' },
                { key: 'outfitSuggestions', label: 'Sugestões de Looks', description: 'Receber sugestões de combinações baseadas no seu guarda-roupa' },
                { key: 'styleAnalysis', label: 'Análise de Estilo', description: 'Analisar seu estilo pessoal e preferências' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{setting.label}</div>
                    <div className="text-sm text-gray-600">{setting.description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.ai[setting.key as keyof typeof preferences.ai]}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      ai: {
                        ...preferences.ai,
                        [setting.key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                </div>
              ))}

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">Limite de Confiança da IA</div>
                    <div className="text-sm text-gray-600">
                      Mínimo de confiança para aceitar sugestões automáticas (atual: {Math.round(preferences.ai.confidenceThreshold * 100)}%)
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={preferences.ai.confidenceThreshold}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    ai: { ...preferences.ai, confidenceThreshold: parseFloat(e.target.value) }
                  })}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Menos preciso</span>
                  <span>Mais preciso</span>
                </div>
              </div>
            </div>
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
              {isLoading ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}