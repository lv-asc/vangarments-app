// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import {
  UserGroupIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground overflow-hidden selection:bg-secondary selection:text-secondary-foreground">
      <Header />

      <main className="relative z-10">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col gap-16"
          >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="text-center md:text-left max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Bem-vindo ao <span className="text-secondary">Vangarments</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                Sua central de moda digital. Organize, crie e inspire-se.
              </p>
            </motion.div>

            {/* Main Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Social Card */}
              <motion.a
                href="/social"
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-card/5 border border-border/10 rounded-3xl p-8 hover:bg-card/10 transition-colors cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <UserGroupIcon className="w-32 h-32 transform rotate-12" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                      <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Comunidade</h2>
                    <p className="text-muted-foreground">Explore o feed, conecte-se com outros amantes da moda e descubra tendências.</p>
                  </div>

                  <div className="mt-8 flex items-center text-secondary font-medium group-hover:gap-2 transition-all">
                    <span>Acessar Social</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </motion.a>

              {/* Wardrobe Card */}
              <motion.a
                href="/wardrobe"
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-card/5 border border-border/10 rounded-3xl p-8 hover:bg-card/10 transition-colors cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <PhotoIcon className="w-32 h-32 transform -rotate-6" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                      <PhotoIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Guarda-roupa</h2>
                    <p className="text-muted-foreground">Gerencie suas peças, crie outfits e mantenha seu acervo digital organizado.</p>
                  </div>

                  <div className="mt-8 flex items-center text-secondary font-medium group-hover:gap-2 transition-all">
                    <span>Ver Guarda-roupa</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </motion.a>

              {/* Create Card */}
              <motion.a
                href="/social/create"
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 rounded-3xl p-8 hover:border-secondary/40 transition-colors cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <PlusIcon className="w-32 h-32 transform rotate-45" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 text-secondary">
                      <PlusIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-secondary">Criar Novo</h2>
                    <p className="text-secondary/70">Compartilhe um look, adicione uma peça ou inicie uma discussão.</p>
                  </div>

                  <div className="mt-8 flex items-center text-white font-medium group-hover:gap-2 transition-all">
                    <span>Começar agora</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </motion.a>
            </div>

            {/* Quick Stats / Footerish area */}
            <motion.div variants={itemVariants} className="mt-12 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                <span>Vangarments 2.0 &bull; Experiência Premium</span>
              </div>
              <div className="flex gap-6">
                <a href="/profile" className="hover:text-white transition-colors">Meu Perfil</a>
                <a href="/settings" className="hover:text-white transition-colors">Configurações</a>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}