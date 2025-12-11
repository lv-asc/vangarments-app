// @ts-nocheck
'use client';

import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

const tiers = [
  {
    name: 'Gratuito',
    id: 'tier-free',
    href: '/register',
    priceMonthly: 'R$ 0',
    description: 'Perfeito para começar a organizar seu guarda-roupa.',
    features: [
      'Até 50 peças catalogadas',
      'Catalogação manual',
      'Perfil básico',
      'Visualização de looks públicos',
      'Suporte por email',
    ],
    mostPopular: false,
  },
  {
    name: 'Premium',
    id: 'tier-premium',
    href: '/register?plan=premium',
    priceMonthly: 'R$ 19,90',
    description: 'Para quem quer aproveitar todo o potencial da plataforma.',
    features: [
      'Peças ilimitadas',
      'IA para catalogação automática',
      'Sugestões de looks personalizadas',
      'Marketplace para venda',
      'Analytics detalhados',
      'Suporte prioritário',
      'Backup automático',
    ],
    mostPopular: true,
  },
  {
    name: 'Influencer',
    id: 'tier-influencer',
    href: '/register?plan=influencer',
    priceMonthly: 'R$ 49,90',
    description: 'Para criadores de conteúdo e profissionais da moda.',
    features: [
      'Todos os recursos Premium',
      'Ferramentas de criação de conteúdo',
      'Analytics avançados de engajamento',
      'Parcerias com marcas',
      'API para integração',
      'Suporte dedicado',
      'Verificação de perfil',
      'Comissões preferenciais',
    ],
    mostPopular: false,
  },
];

export function PricingSection() {
  return (
    <div id="pricing" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#00132d]">Preços</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Escolha o plano ideal para você
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Comece gratuitamente e evolua conforme suas necessidades.
          Todos os planos incluem acesso à nossa comunidade de moda.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-3xl p-8 ring-1 ${tier.mostPopular
                  ? 'bg-[#fff7d7] ring-[#00132d]/20 relative'
                  : 'ring-gray-200'
                }`}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-[#00132d] px-4 py-1 text-sm font-medium text-[#fff7d7]">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={`text-lg font-semibold leading-8 ${tier.mostPopular ? 'text-[#00132d]' : 'text-gray-900'
                    }`}
                >
                  {tier.name}
                </h3>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>

              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {tier.priceMonthly}
                </span>
                {tier.priceMonthly !== 'R$ 0' && (
                  <span className="text-sm font-semibold leading-6 text-gray-600">/mês</span>
                )}
              </p>

              <Link
                href={tier.href}
                aria-describedby={tier.id}
                className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tier.mostPopular
                    ? 'bg-[#00132d] text-[#fff7d7] shadow-sm hover:bg-[#00132d]/90 focus-visible:outline-[#00132d]'
                    : 'ring-1 ring-inset ring-[#00132d]/20 text-[#00132d] hover:ring-[#00132d]/30'
                  }`}
              >
                {tier.name === 'Gratuito' ? 'Começar grátis' : 'Assinar plano'}
              </Link>

              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className={`h-6 w-5 flex-none ${tier.mostPopular ? 'text-[#00132d]' : 'text-gray-400'
                        }`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}