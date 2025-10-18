'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { 
  UserGroupIcon,
  PhotoIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#00132d] to-[#001a3d] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Sua Plataforma de
                <span className="block text-[#fff7d7]">Moda Social</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Organize seu guarda-roupa, compartilhe seus looks e descubra inspirações 
                na maior comunidade de moda do Brasil
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-[#fff7d7] text-[#00132d] hover:bg-[#fff7d7]/90"
                  onClick={() => window.location.href = '/social'}
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Explorar Social
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-[#00132d]"
                  onClick={() => window.location.href = '/wardrobe-real'}
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Meu Guarda-roupa
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Funcionalidades Reais
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Todas as funcionalidades conectam com dados reais e persistem permanentemente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Social Platform */}
              <div className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Plataforma Social</h3>
                <p className="text-gray-600 mb-6">
                  Compartilhe looks, siga outros usuários e descubra inspirações. 
                  Todos os posts, likes e comentários são reais e persistem no banco de dados.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/social'}
                  className="w-full"
                >
                  Explorar Feed
                </Button>
              </div>

              {/* Real Wardrobe */}
              <div className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PhotoIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Guarda-roupa Real</h3>
                <p className="text-gray-600 mb-6">
                  Adicione suas peças reais com fotos, organize por categorias VUFS 
                  e construa seu guarda-roupa digital permanentemente.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/wardrobe-real'}
                  className="w-full"
                >
                  Ver Guarda-roupa
                </Button>
              </div>

              {/* Content Creation */}
              <div className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PlusIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Criação de Conteúdo</h3>
                <p className="text-gray-600 mb-6">
                  Crie posts de looks, peças individuais ou inspirações. 
                  Todo conteúdo é armazenado permanentemente e pode ser compartilhado.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/social/create'}
                  className="w-full"
                >
                  Criar Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Real Data Section */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <SparklesIcon className="h-12 w-12 text-[#00132d] mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Dados Reais, Crescimento Orgânico
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Eliminamos todos os dados falsos. Tudo que você vê e interage é real, 
                construído através do uso genuíno da plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Como Funciona</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00132d] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Adicione Peças Reais</h4>
                      <p className="text-gray-600">Fotografe e catalogue suas roupas reais no sistema VUFS</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00132d] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Compartilhe Looks</h4>
                      <p className="text-gray-600">Crie posts com suas peças e compartilhe com a comunidade</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00132d] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Construa Conexões</h4>
                      <p className="text-gray-600">Siga usuários, curta posts e construa sua rede social de moda</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Reais</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Posts Criados</span>
                    <span className="font-bold text-[#00132d]">Crescimento Orgânico</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Usuários Ativos</span>
                    <span className="font-bold text-[#00132d]">Comunidade Real</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Peças Catalogadas</span>
                    <span className="font-bold text-[#00132d]">Guarda-roupas Reais</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Interações</span>
                    <span className="font-bold text-[#00132d]">Engajamento Genuíno</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>100% Dados Reais:</strong> Nenhum conteúdo falso ou gerado artificialmente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-[#00132d] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para Começar?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Junte-se à comunidade e comece a construir seu guarda-roupa digital hoje mesmo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#fff7d7] text-[#00132d] hover:bg-[#fff7d7]/90"
                onClick={() => window.location.href = '/social'}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Explorar Comunidade
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[#00132d]"
                onClick={() => window.location.href = '/wardrobe-real'}
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Começar Guarda-roupa
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}