'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { navigate } = useNavigation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if we're in development mode
      const devMode = localStorage.getItem('devMode') === 'true';
      
      if (!devMode) {
        setError('Please enable Development Mode using the DEV button in the bottom-right corner to test without a server.');
        setLoading(false);
        return;
      }

      await login(email, password);
      await navigate('/beta');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    if (userEmail === 'lvicentini10@gmail.com') {
      setPassword('V-App_M4sterAccess.23');
    } else {
      setPassword('password');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7d7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#00132d]/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#00132d] mb-2">Welcome Back</h1>
            <p className="text-[#00132d]/70">Sign in to access your Vangarments account</p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-800 font-medium">Development Mode</p>
                <p className="text-blue-700">
                  Enable the DEV toggle (bottom-right) to test without a server, 
                  then use the quick login buttons below.
                </p>
              </div>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#00132d] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20 focus:border-[#00132d]"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#00132d] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20 focus:border-[#00132d]"
                placeholder="••••••••"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00132d] text-[#fff7d7] py-3 rounded-lg font-semibold hover:bg-[#00132d]/90 transition-colors disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Development Mode Quick Login */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-6 border-t border-[#00132d]/10">
              <h3 className="text-sm font-medium text-[#00132d] mb-3">Quick Login (Dev Mode)</h3>
              <div className="space-y-2">
                <button
                  onClick={() => quickLogin('lvicentini10@gmail.com')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#fff7d7] border-2 border-[#00132d]/20 transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="text-sm font-bold text-[#00132d]">
                      Leandro Martins Vicentini
                    </div>
                    <div className="w-4 h-4 bg-[#00132d] rounded-full flex items-center justify-center text-[#fff7d7] text-xs font-bold">
                      DEV
                    </div>
                  </div>
                  <div className="text-xs text-purple-600 font-medium">lvicentini10@gmail.com</div>
                  <div className="text-xs text-blue-500 font-medium">Master Developer • Full Access • Admin</div>
                </button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Click any user above to auto-fill credentials, then click "Sign In"
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-[#00132d]/70">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
                className="text-[#00132d] font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}