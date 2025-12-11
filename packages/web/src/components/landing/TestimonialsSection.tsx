// @ts-nocheck
'use client';

import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Ana Carolina',
      role: 'Influenciadora Digital',
      avatar: '/avatars/ana.jpg',
      rating: 5,
      content: 'O Vangarments revolucionou como eu organizo meu guarda-roupa! Agora consigo planejar looks com antecedência e nunca mais fico sem saber o que vestir.',
      location: 'São Paulo, SP'
    },
    {
      name: 'Mariana Santos',
      role: 'Consultora de Moda',
      avatar: '/avatars/mariana.jpg',
      rating: 5,
      content: 'Como consultora, uso a plataforma para ajudar minhas clientes. O sistema de análise de estilo é incrível e as sugestões são sempre certeiras!',
      location: 'Rio de Janeiro, RJ'
    },
    {
      name: 'Juliana Oliveira',
      role: 'Estudante',
      avatar: '/avatars/juliana.jpg',
      rating: 5,
      content: 'Adorei poder catalogar todas as minhas roupas e descobrir novas combinações. A comunidade é super acolhedora e sempre me inspiro com os looks das outras meninas.',
      location: 'Belo Horizonte, MG'
    },
    {
      name: 'Camila Rodrigues',
      role: 'Empresária',
      avatar: '/avatars/camila.jpg',
      rating: 5,
      content: 'Perfeito para quem tem uma rotina corrida como eu. Consigo planejar a semana toda de looks em poucos minutos. A IA realmente entende meu estilo!',
      location: 'Brasília, DF'
    },
    {
      name: 'Fernanda Lima',
      role: 'Designer',
      avatar: '/avatars/fernanda.jpg',
      rating: 5,
      content: 'A interface é linda e super intuitiva. Como designer, aprecio muito a atenção aos detalhes. É realmente a melhor plataforma de moda que já usei.',
      location: 'Porto Alegre, RS'
    },
    {
      name: 'Beatriz Costa',
      role: 'Jornalista',
      avatar: '/avatars/beatriz.jpg',
      rating: 5,
      content: 'Uso para organizar looks para eventos e viagens. O recurso de planejamento é fantástico e me ajuda muito no dia a dia profissional.',
      location: 'Salvador, BA'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#fff7d7] via-[#fff7d7]/30 to-[#fff7d7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            O que nossos usuários{' '}
            <span className="text-[#00132d] font-bold">
              estão dizendo
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Mais de 10.000 mulheres já transformaram sua relação com a moda usando nossa plataforma.
            Veja alguns depoimentos reais de nossa comunidade.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#00132d] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">10k+</div>
            <div className="text-gray-600">Usuárias Ativas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">500k+</div>
            <div className="text-gray-600">Peças Catalogadas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">1M+</div>
            <div className="text-gray-600">Looks Criados</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
            <div className="text-gray-600">Avaliação Média</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}