// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { CPFInput } from '@/components/ui/CPFInput';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';
import { formatPhone } from '@/lib/masks';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { FacebookButton } from '@/components/auth/FacebookButton';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    cpf: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
    gender: '',
    genderOther: '',
    bodyType: '',
    birthDate: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { navigate } = useNavigation();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  useEffect(() => {
    if (searchParams) {
      const errorParam = searchParams.get('error');
      if (errorParam === 'account_exists') {
        setError('An account with this email already exists. Please log in instead.');
      } else if (errorParam === 'account_not_found') {
        setError('Account not found. Please register with Google/Facebook or fill the form.');
      }
    }
  }, [searchParams]);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({
      ...prev,
      telephone: formatted
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Você deve aceitar os termos de uso');
      return;
    }

    setIsLoading(true);

    const [isSuccess, setIsSuccess] = useState(false);

    // ... (inside handleSubmit after register call)
    try {
      await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password: formData.password,
        cpf: formData.cpf,
        telephone: formData.telephone,
        birthDate: formData.birthDate,
        gender: formData.gender as any,
        genderOther: formData.genderOther,
        bodyType: formData.bodyType as any,
      });
      setIsSuccess(true);
    } catch (error) {
      // Error is handled by the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fff7d7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Please check your email ({formData.email}) to verify your account before logging in.
          </p>
          <Link href="/login">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="mb-6 space-y-3">
              <GoogleButton text="Sign up with Google" action="signup" />
              <FacebookButton text="Sign up with Facebook" action="signup" />
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
                </div>
              </div>
            </div>

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
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome de usuário
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="Seu nome de usuário (ex: usuario123)"
                  pattern="[a-zA-Z0-9_.]+"
                  title="Apenas letras, números, sublinhados e pontos"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Apenas letras, números, sublinhados e pontos
                </p>
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
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone (WhatsApp)
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.telephone}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="(00) 00000-0000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para contato e recuperação de conta
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

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de nascimento
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você deve ter pelo menos 13 anos para se cadastrar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gênero
                </label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={handleChange}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                        />
                        <span className="ml-2 text-gray-700 capitalize">
                          {option === 'male' ? 'Masculino' : option === 'female' ? 'Feminino' : 'Outro'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {formData.gender === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pl-4 border-l-2 border-pink-100"
                    >
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Especifique (opcional)</label>
                        <input
                          type="text"
                          name="genderOther"
                          value={formData.genderOther}
                          onChange={handleChange}
                          placeholder="ex: Não-binário"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tipo de corpo (para provador virtual)</label>
                        <div className="flex gap-4">
                          {['male', 'female'].map((type) => (
                            <label key={type} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="bodyType"
                                value={type}
                                checked={formData.bodyType === type}
                                onChange={handleChange}
                                required={formData.gender === 'other'}
                                className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                corpo {type === 'male' ? 'masculino' : 'feminino'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
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
                Log in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}