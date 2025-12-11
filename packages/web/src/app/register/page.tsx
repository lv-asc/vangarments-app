// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { CPFInput } from '@/components/ui/CPFInput';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { navigate } = useNavigation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCPFChange = (cpf: string) => {
    setFormData(prev => ({
      ...prev,
      cpf
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (!formData.acceptTerms) {
      alert('Você deve aceitar os termos de uso');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
      });
    } catch (error) {
      // Error is handled by the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'];

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-[#fff7d7] via-[#fff7d7]/50 to-[#fff7d7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="flex items-center justify-center space-x-2 mb-8"
            >
              <div className="h-10 w-10 bg-[#00132d] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Vangarments</span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">
              Crie sua conta
            </h2>
            <p className="mt-2 text-gray-600">
              Junte-se a milhares de pessoas que já transformaram sua relação com a moda
            </p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                  CPF
                </label>
                <CPFInput
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Necessário para verificação de identidade no Brasil
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="Crie uma senha forte"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Força da senha: {strengthLabels[strength - 1] || 'Muito fraca'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
                )}
              </div>

              {/* Terms and Marketing */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      required
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <div className="text-gray-700">
                      Eu aceito os{' '}
                      <Link
                        href="/terms"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/terms');
                        }}
                        className="text-pink-600 hover:text-pink-500 font-medium"
                      >
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link
                        href="/privacy"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/privacy');
                        }}
                        className="text-pink-600 hover:text-pink-500 font-medium"
                      >
                        Política de Privacidade
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptMarketing"
                      name="acceptMarketing"
                      type="checkbox"
                      checked={formData.acceptMarketing}
                      onChange={handleChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptMarketing" className="text-gray-700">
                      Quero receber dicas de moda e novidades por email (opcional)
                    </label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading || !formData.acceptTerms}
              >
                {isLoading ? 'Criando conta...' : 'Criar conta gratuita'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                Faça login
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}