'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { XIcon } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShieldCheckIcon, 
  EyeIcon, 
  EyeSlashIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacySettings({ isOpen, onClose }: PrivacySettingsProps) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [settings, setSettings] = useState({
    dataCollection: {
      analytics: user?.preferences?.privacy?.analytics ?? true,
      aiTraining: user?.preferences?.privacy?.aiTraining ?? true,
      marketingEmails: user?.preferences?.privacy?.marketingEmails ?? false,
      thirdPartySharing: user?.preferences?.privacy?.thirdPartySharing ?? false
    },
    visibility: {
      profile: user?.preferences?.visibility?.profile ?? 'public',
      wardrobe: user?.preferences?.visibility?.wardrobe ?? 'public',
      measurements: user?.preferences?.visibility?.measurements ?? 'private',
      activity: user?.preferences?.visibility?.activity ?? 'public',
      purchases: user?.preferences?.visibility?.purchases ?? 'private'
    },
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      push: user?.preferences?.notifications?.push ?? true,
      sms: user?.preferences?.notifications?.sms ?? false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        preferences: {
          ...user?.preferences,
          privacy: settings.dataCollection,
          visibility: settings.visibility,
          notifications: settings.notifications
        }
      });
      onClose();
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    // In a real app, this would trigger a data export process
    alert('Seus dados serão preparados e enviados por email em até 48 horas.');
  };

  const handleAccountDeletion = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    // In a real app, this would trigger account deletion process
    alert('Processo de exclusão iniciado. Você receberá um email de confirmação.');
    setShowDeleteConfirm(false);
  };

  const visibilityOptions = [
    { value: 'public', label: 'Público', icon: EyeIcon, description: 'Visível para todos' },
    { value: 'friends', label: 'Amigos', icon: EyeIcon, description: 'Apenas pessoas que você segue' },
    { value: 'private', label: 'Privado', icon: EyeSlashIcon, description: 'Apenas você' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-pink-500" />
            <h2 className="text-xl font-semibold text-gray-900">Privacidade e Dados</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Data Collection Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Coleta de Dados</h3>
            <p className="text-sm text-gray-600">
              Controle como seus dados são coletados e utilizados para melhorar sua experiência.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Análise de Uso</div>
                  <div className="text-sm text-gray-600">
                    Permite coletar dados sobre como você usa o app para melhorar funcionalidades
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataCollection.analytics}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataCollection: { ...settings.dataCollection, analytics: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Treinamento de IA</div>
                  <div className="text-sm text-gray-600">
                    Permite usar suas fotos para melhorar nossos modelos de reconhecimento de moda
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataCollection.aiTraining}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataCollection: { ...settings.dataCollection, aiTraining: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Emails de Marketing</div>
                  <div className="text-sm text-gray-600">
                    Receber ofertas especiais, novidades e conteúdo personalizado
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataCollection.marketingEmails}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataCollection: { ...settings.dataCollection, marketingEmails: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Compartilhamento com Terceiros</div>
                  <div className="text-sm text-gray-600">
                    Permitir compartilhar dados anonimizados com parceiros para pesquisa de mercado
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataCollection.thirdPartySharing}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataCollection: { ...settings.dataCollection, thirdPartySharing: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configurações de Visibilidade</h3>
            <p className="text-sm text-gray-600">
              Controle quem pode ver diferentes partes do seu perfil e atividade.
            </p>
            
            <div className="space-y-6">
              {[
                { key: 'profile', label: 'Perfil Geral', description: 'Nome, foto, bio e informações básicas' },
                { key: 'wardrobe', label: 'Guarda-roupa', description: 'Suas peças e coleções' },
                { key: 'measurements', label: 'Medidas', description: 'Suas medidas corporais e tamanhos' },
                { key: 'activity', label: 'Atividade', description: 'Curtidas, comentários e interações' },
                { key: 'purchases', label: 'Compras', description: 'Histórico de compras e vendas' }
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                  <div className="flex space-x-2">
                    {visibilityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSettings({
                          ...settings,
                          visibility: { ...settings.visibility, [item.key]: option.value }
                        })}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          settings.visibility[item.key as keyof typeof settings.visibility] === option.value
                            ? 'bg-pink-50 border-pink-200 text-pink-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Preferências de Notificação</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Notificações por Email</div>
                  <div className="text-sm text-gray-600">Receber atualizações importantes por email</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Notificações Push</div>
                  <div className="text-sm text-gray-600">Receber notificações no dispositivo</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">SMS</div>
                  <div className="text-sm text-gray-600">Receber notificações por SMS (apenas urgentes)</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Gerenciamento de Dados</h3>
            <p className="text-sm text-gray-600">
              Conforme a LGPD, você tem direito de acessar, corrigir ou excluir seus dados.
            </p>
            
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleDataExport}
                className="w-full justify-start"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Baixar Meus Dados
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAccountDeletion}
                className={`w-full justify-start ${
                  showDeleteConfirm 
                    ? 'text-red-600 border-red-300 hover:bg-red-50' 
                    : 'text-red-600 hover:text-red-700'
                }`}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {showDeleteConfirm ? 'Confirmar Exclusão da Conta' : 'Excluir Conta'}
              </Button>

              {showDeleteConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">Atenção: Esta ação é irreversível!</p>
                      <p>
                        Todos os seus dados, incluindo perfil, guarda-roupa, fotos e histórico 
                        serão permanentemente excluídos. Você tem 30 dias para cancelar esta ação.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="mt-2 mr-2"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}