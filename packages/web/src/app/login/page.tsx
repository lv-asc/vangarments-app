// @ts-nocheck
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { FacebookButton } from '@/components/auth/FacebookButton';
import { AppleButton } from '@/components/auth/AppleButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuth();
  const { navigate } = useNavigation();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  React.useEffect(() => {
    if (searchParams) {
      const errorParam = searchParams.get('error');
      if (errorParam === 'google_signin_disabled') {
        setError('Google login is currently disabled for your account. Please log in with your email and password, or enable Google login in your account settings.');
      } else if (errorParam === 'account_not_found') {
        setError('Account not found. Please register first.');
      } else if (errorParam === 'account_exists') {
        setError('An account with this email already exists. Please log in instead.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // devMode check removed to allow real backend connection


      await login(email, password);
      await navigate('/wardrobe');
    } catch (err: any) {
      if (err.message && err.message.includes('verify your email')) {
        setNeedsVerification(true);
        setError('Email not verified. Please check your inbox or resend the verification email.');
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to resend verification email');
      }

      alert('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResendLoading(false);
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
            <p className="text-[#00132d]/70">Log in to access your Vangarments account</p>


          </div>

          <div className="mb-6 space-y-3">
            <GoogleButton action="login" />
            <FacebookButton action="login" />
            {/* <AppleButton action="login" /> -- Requires Paid Apple Developer Account */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              <p>{error}</p>
              {needsVerification && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-2 text-xs font-semibold underline hover:text-red-900 disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}
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
              {loading ? 'Logging in...' : 'Log in'}
            </motion.button>
          </form>

          {/* Development Mode Quick Login */}


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