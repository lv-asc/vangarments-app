// @ts-nocheck
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/flags';
import { XIcon } from '@/components/ui/icons';
import { useAuth } from '@/contexts/AuthWrapper';
import VerificationRequestModal from '@/components/verification/VerificationRequestModal';
import {
  BellIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

export function AccountPreferences() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [preferences, setPreferences] = useState({
    language: user?.preferences?.language ?? 'pt-BR',
    currency: user?.preferences?.currency ?? 'BRL',
    theme: user?.preferences?.theme ?? 'light',
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

  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      await updateProfile({
        preferences: {
          ...user?.preferences,
          ...preferences
        }
      });
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
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

  return (
    <div className="bg-white rounded-lg">
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Request Verification */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">Request Verification</h4>
              <p className="text-sm text-blue-700">
                Get a verified badge on your profile. Verified accounts receive a blue checkmark.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Request Verification
            </button>
          </div>
        </div>

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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${preferences.theme === theme.value
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
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </form>

      {/* Verification Request Modal */}
      <VerificationRequestModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        requestType="user"
      />
    </div>
  );
}