'use client';

import { motion } from 'framer-motion';
import { 
  CameraIcon, 
  SparklesIcon, 
  UserGroupIcon, 
  ShoppingBagIcon,
  ChartBarIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Catalogação Inteligente',
    description: 'IA avançada identifica automaticamente suas peças, cores, materiais e categorias seguindo o padrão VUFS.',
    icon: CameraIcon,
    color: 'from-[#00132d] to-[#00132d]/80',
  },
  {
    name: 'Styling Automático',
    description: 'Receba sugestões personalizadas de looks baseadas no seu guarda-roupa, ocasião e preferências.',
    icon: SparklesIcon,
    color: 'from-[#00132d]/80 to-[#00132d]/60',
  },
  {
    name: 'Rede Social de Moda',
    description: 'Compartilhe seus looks, descubra tendências e conecte-se com outros apaixonados por moda.',
    icon: UserGroupIcon,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Marketplace Integrado',
    description: 'Venda peças que não usa mais e descubra itens únicos de outros usuários e marcas parceiras.',
    icon: ShoppingBagIcon,
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Analytics de Estilo',
    description: 'Entenda seus hábitos de consumo, peças mais usadas e otimize seu guarda-roupa.',
    icon: ChartBarIcon,
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Privacidade Garantida',
    description: 'Seus dados estão protegidos com criptografia avançada e conformidade total com a LGPD.',
    icon: ShieldCheckIcon,
    color: 'from-gray-500 to-slate-500',
  },
];

export function FeaturesSection() {
  return (
    <div id="features" className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#00132d]">
            Recursos Inovadores
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tudo que você precisa para revolucionar seu guarda-roupa
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Nossa plataforma combina inteligência artificial, rede social e marketplace 
            para criar a experiência de moda mais completa do Brasil.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}