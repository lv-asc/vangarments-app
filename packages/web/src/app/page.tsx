// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthWrapper';
import { useRouter } from 'next/navigation';
import { AVAILABLE_ROLES } from '@/constants/roles';

export default function HomePage() {
  const { setActiveRole } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (role: typeof AVAILABLE_ROLES[0]) => {
    setActiveRole(role.id);
    router.push(role.route);
  };

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



            {/* Experience / Roles Section */}
            <div className="mt-16">
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Escolha sua Experiência</h2>
                <p className="text-muted-foreground">Selecione como você deseja interagir com o Vangarments hoje.</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_ROLES.map((role) => (
                  <motion.button
                    key={role.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(role)}
                    className="flex flex-col items-start p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-left group"
                  >
                    <div className="p-3 bg-secondary/10 rounded-xl mb-4 group-hover:bg-secondary/20 transition-colors">
                      <StarIcon className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{role.label}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{role.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Stats / Footerish area */}


          </motion.div>
        </div>
      </main>
    </div>
  );
}