'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { MeasurementManager } from '@/components/profile/MeasurementManager';
import { PrivacySettings } from '@/components/profile/PrivacySettings';
import { AccountPreferences } from '@/components/profile/AccountPreferences';
import { 
  CameraIcon, 
  PencilIcon, 
  ChartBarIcon,
  HeartIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CogIcon,
  ScaleIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon, TrophyIcon, LeafIcon } from '@/components/ui/icons';
import { UserAvatar, UserDisplay } from '@/components/ui/UserAvatar';
import BetaPioneerBadge from '@/components/beta/BetaPioneerBadge';
import DeveloperBadge from '@/components/dev/DeveloperBadge';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showAccountPreferences, setShowAccountPreferences] = useState(false);
  
  // Mock beta status for development - check if user is developer
  const betaStatus = user?.isDeveloper ? { isBetaParticipant: true } : null;

  // If no user, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-blue-900 mb-2">Acesse seu Perfil</h1>
            <p className="text-blue-700 mb-4">Faça login para acessar e gerenciar seu perfil.</p>
            

            
            <Button 
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fazer Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const renderBadgeIcon = (iconType: string, size: 'sm' | 'lg' = 'sm') => {
    const iconSize = size === 'sm' ? 'md' : 'lg';
    const iconClass = size === 'sm' ? 'text-green-600' : 'text-green-600';
    
    switch (iconType) {
      case 'leaf':
        return <LeafIcon className={iconClass} size={iconSize} />;
      case 'sparkles':
        return <SparklesIcon className="text-yellow-500" size={iconSize} />;
      case 'trophy':
        return <TrophyIcon className="text-amber-500" size={iconSize} />;
      default:
        return <div className={`w-5 h-5 bg-gray-200 rounded-full`}></div>;
    }
  };

  // Mock user data
  const mockUser = {
    id: 'dev-master-lve',
    name: 'Leandro Martins Vicentini',
    email: 'lvicentini10@gmail.com',
    username: 'lv',
    avatar: '/api/placeholder/120/120',
    bio: 'Master Developer and Creator of the Vangarments Platform. Building the future of fashion technology.',
    location: 'Valinhos, SP',
    joinedDate: '2023-01-01',
    stats: {
      items: 47,
      outfits: 23,
      followers: 156,
      following: 89,
      likes: 342
    },
    badges: [
      { name: 'Master Developer', icon: 'sparkles', description: 'Full development access and control' },
      { name: 'App Creator', icon: 'trophy', description: 'Vangarments platform creator' },
      { name: 'Beta Pioneer', icon: 'leaf', description: 'Early beta program participant' }
    ]
  };

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: ChartBarIcon },
    { id: 'favorites', name: 'Favoritos', icon: HeartIcon },
    { id: 'selling', name: 'Vendendo', icon: ShoppingBagIcon },
    { id: 'social', name: 'Social', icon: UserGroupIcon },
    { id: 'settings', name: 'Configurações', icon: CogIcon },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Faça login para acessar seu perfil
          </h1>
          <Button href="/login">Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-[#00132d] to-[#00132d]/80"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              <div className="relative -mt-16 mb-4 sm:mb-0">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-white shadow-lg rounded-full overflow-hidden">
                    <UserAvatar 
                      user={mockUser} 
                      size="xl" 
                      className="w-full h-full text-2xl"
                    />
                  </div>
                  <button className="absolute bottom-2 right-2 bg-[#00132d] text-[#fff7d7] p-2 rounded-full shadow-lg hover:bg-[#00132d]/90 transition-colors">
                    <CameraIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-col space-y-1">
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <span>{mockUser.name}</span>
                        <div className="flex space-x-1 items-center">
                          {user?.isDeveloper && (
                            <DeveloperBadge size="small" showLabel={false} />
                          )}
                          {betaStatus?.isBetaParticipant && (
                            <BetaPioneerBadge size="small" showLabel={false} />
                          )}
                          {mockUser.badges.slice(0, 2).map((badge) => (
                            <span key={badge.name} className="inline-flex" title={badge.description}>
                              {renderBadgeIcon(badge.icon, 'sm')}
                            </span>
                          ))}
                        </div>
                      </h1>
                      <p className="text-lg text-gray-500">@{mockUser.username}</p>
                    </div>
                    <p className="text-gray-600 mt-1">{mockUser.location}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4 sm:mt-0 flex items-center space-x-2"
                    onClick={() => setShowProfileEdit(true)}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Editar Perfil</span>
                  </Button>
                </div>
                
                <p className="text-gray-700 mt-4 max-w-2xl">
                  {mockUser.bio}
                </p>
                
                <div className="flex flex-wrap gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{mockUser.stats.items}</div>
                    <div className="text-sm text-gray-600">Peças</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{mockUser.stats.outfits}</div>
                    <div className="text-sm text-gray-600">Looks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{mockUser.stats.followers}</div>
                    <div className="text-sm text-gray-600">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{mockUser.stats.following}</div>
                    <div className="text-sm text-gray-600">Seguindo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{mockUser.stats.likes}</div>
                    <div className="text-sm text-gray-600">Curtidas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#00132d] text-[#00132d]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conquistas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUser.badges.map((badge) => (
                    <div key={badge.name} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {renderBadgeIcon(badge.icon, 'lg')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{badge.name}</div>
                        <div className="text-sm text-gray-600">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Adicionou 3 novas peças ao guarda-roupa</span>
                    <span className="text-sm text-gray-500 ml-auto">2 horas atrás</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Criou um novo look "Casual Friday"</span>
                    <span className="text-sm text-gray-500 ml-auto">1 dia atrás</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-[#00132d] rounded-full"></div>
                    <span className="text-gray-700">Vendeu "Vestido Floral Midi"</span>
                    <span className="text-sm text-gray-500 ml-auto">3 dias atrás</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="text-center py-12">
              <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Seus Favoritos</h3>
              <p className="text-gray-600">Suas peças e looks favoritos aparecerão aqui.</p>
            </div>
          )}

          {activeTab === 'selling' && (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Itens à Venda</h3>
              <p className="text-gray-600">Gerencie os itens que você está vendendo no marketplace.</p>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Atividade Social</h3>
              <p className="text-gray-600">Veja suas interações, seguidores e pessoas que você segue.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações da Conta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowProfileEdit(true)}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <PencilIcon className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Editar Perfil</div>
                      <div className="text-sm text-gray-600">Nome, bio, localização e redes sociais</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowMeasurements(true)}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <ScaleIcon className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Medidas</div>
                      <div className="text-sm text-gray-600">Gerenciar medidas e tamanhos</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowPrivacySettings(true)}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Privacidade</div>
                      <div className="text-sm text-gray-600">Controle de dados e visibilidade</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowAccountPreferences(true)}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Preferências</div>
                      <div className="text-sm text-gray-600">Idioma, notificações e IA</div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Conformidade com LGPD</h4>
                <p className="text-sm text-blue-700">
                  Seus dados são protegidos conforme a Lei Geral de Proteção de Dados (LGPD). 
                  Você pode acessar, corrigir ou excluir seus dados a qualquer momento através 
                  das configurações de privacidade.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProfileEditModal 
        isOpen={showProfileEdit} 
        onClose={() => setShowProfileEdit(false)} 
      />
      <MeasurementManager 
        isOpen={showMeasurements} 
        onClose={() => setShowMeasurements(false)} 
      />
      <PrivacySettings 
        isOpen={showPrivacySettings} 
        onClose={() => setShowPrivacySettings(false)} 
      />
      <AccountPreferences 
        isOpen={showAccountPreferences} 
        onClose={() => setShowAccountPreferences(false)} 
      />
    </div>
  );
}