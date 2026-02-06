// @ts-nocheck
'use client';

import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Ana Carolina',
      role: 'Digital Influencer',
      avatar: '/avatars/ana.jpg',
      rating: 5,
      content: 'Vangarments revolutionized how I organize my wardrobe! Now I can plan outfits in advance and never feel lost about what to wear.',
      location: 'São Paulo, SP'
    },
    {
      name: 'Mariana Santos',
      role: 'Fashion Consultant',
      avatar: '/avatars/mariana.jpg',
      rating: 5,
      content: 'As a consultant, I use the platform to help my clients. The style analysis system is incredible and the suggestions are always spot on!',
      location: 'Rio de Janeiro, RJ'
    },
    {
      name: 'Juliana Oliveira',
      role: 'Student',
      avatar: '/avatars/juliana.jpg',
      rating: 5,
      content: 'I loved being able to catalog all my clothes and discover new combinations. The community is super welcoming and I always get inspired by outfits from other users.',
      location: 'Belo Horizonte, MG'
    },
    {
      name: 'Camila Rodrigues',
      role: 'Entrepreneur',
      avatar: '/avatars/camila.jpg',
      rating: 5,
      content: 'Perfect for someone with a busy routine like me. I can plan my weekly outfits in just a few minutes. The AI really understands my style!',
      location: 'Brasília, DF'
    },
    {
      name: 'Fernanda Lima',
      role: 'Designer',
      avatar: '/avatars/fernanda.jpg',
      rating: 5,
      content: 'The interface is beautiful and super intuitive. As a designer, I really appreciate the attention to detail. It truly is the best fashion platform I have ever used.',
      location: 'Porto Alegre, RS'
    },
    {
      name: 'Beatriz Costa',
      role: 'Journalist',
      avatar: '/avatars/beatriz.jpg',
      rating: 5,
      content: 'I use it to organize outfits for events and trips. The planning feature is fantastic and helps me a lot in my professional daily life.',
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
            What our users{' '}
            <span className="text-[#00132d] font-bold">
              are saying
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Over 10,000 users have already transformed their relationship with fashion using our platform.
            See some real testimonials from our community.
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
            <div className="text-gray-600">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">500k+</div>
            <div className="text-gray-600">Items Cataloged</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">1M+</div>
            <div className="text-gray-600">Outfits Created</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}