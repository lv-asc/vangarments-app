'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Bars3Icon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  EyeIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  MegaphoneIcon,
  BeakerIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';
import { Navigation } from './Navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTranslation } from '@/utils/translations';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { navigate, currentPath, isNavigating } = useNavigation();
  const { t } = useTranslation();

  // Debug info for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Header Debug:', {
      user,
      isAuthenticated,
      currentPath,
      isNavigating,
      devMode: typeof window !== 'undefined' ? localStorage.getItem('devMode') : null,
      mockUser: typeof window !== 'undefined' ? localStorage.getItem('mockUser') : null
    });
  }

  const navigation = [
    { name: t('discover'), href: '/discover', icon: MagnifyingGlassIcon },
    { name: 'Social', href: '/social', icon: UserGroupIcon },
    { name: t('wardrobe'), href: '/wardrobe-real', icon: HomeIcon },
    { name: t('looks'), href: '/outfits', icon: EyeIcon },
    { name: t('marketplace'), href: '/marketplace-simple', icon: ShoppingBagIcon },
    { name: t('analytics'), href: '/analytics', icon: ChartBarIcon },
    { name: t('advertising'), href: '/advertising', icon: MegaphoneIcon },
    { name: t('beta'), href: '/beta', special: true, icon: BeakerIcon },
  ];

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  const handleNavigation = async (href: string, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('🔧 Header: Navigation clicked', { href, currentPath });
    
    if (href === currentPath) {
      console.log('🔧 Header: Already on current path');
      return;
    }

    const success = await navigate(href);
    if (!success) {
      console.error('❌ Header: Navigation failed', { href });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-[#fff7d7] shadow-sm sticky top-0 z-50 border-b border-[#00132d]/10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/assets/images/logo-header.svg" 
                alt="Vangarments Logo" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Always Visible */}
          <div className="ml-10 hidden space-x-6 lg:flex items-center">
            {navigation.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavigation(link.href, e)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#00132d] bg-[#00132d]/10'
                      : link.special 
                        ? 'text-[#00132d] hover:bg-[#00132d]/10' 
                        : 'text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5'
                  } ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
                  title={link.name}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop User Menu or Auth Buttons */}
          <div className="ml-10 hidden lg:flex items-center space-x-4">
            <LanguageSelector />
            
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-[#00132d]/80 hover:text-[#00132d] transition-colors"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-gray-500">@{user.username || user.email?.split('@')[0] || 'user'}</span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-[#fff7d7] rounded-md shadow-lg py-1 z-50 border border-[#00132d]/20"
                    >
                      <Link
                        href="/profile-simple"
                        onClick={(e) => {
                          handleNavigation('/profile-simple', e);
                          setIsUserMenuOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-[#00132d]/80 hover:bg-[#00132d]/5"
                      >
                        {t('myProfile')}
                      </Link>
                      <Link
                        href="/wardrobe-simple"
                        onClick={(e) => {
                          handleNavigation('/wardrobe-simple', e);
                          setIsUserMenuOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-[#00132d]/80 hover:bg-[#00132d]/5"
                      >
                        {t('myWardrobe')}
                      </Link>
                      <div className="border-t border-[#00132d]/10"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-[#00132d]/80 hover:bg-[#00132d]/5"
                      >
                        {t('logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/login"
                  onClick={(e) => handleNavigation('/login', e)}
                  className="inline-block bg-[#00132d]/5 py-2 px-4 border border-[#00132d]/20 rounded-md text-base font-medium text-[#00132d] hover:bg-[#00132d]/10 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={(e) => handleNavigation('/register', e)}
                  className="inline-block bg-[#00132d] py-2 px-4 border border-transparent rounded-md text-base font-medium text-[#fff7d7] hover:bg-[#00132d]/90 transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="bg-[#fff7d7] rounded-md p-2 inline-flex items-center justify-center text-[#00132d]/60 hover:text-[#00132d] hover:bg-[#00132d]/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00132d]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Abrir menu principal</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden"
            >
              <div className="space-y-1 pt-2 pb-3">
                {navigation.map((link) => {
                  const isActive = currentPath === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={(e) => handleNavigation(link.href, e)}
                      className={`flex items-center space-x-3 pl-3 pr-4 py-2 text-base font-medium transition-colors ${
                        isActive
                          ? 'text-[#00132d] bg-[#00132d]/10'
                          : 'text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5'
                      } ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
                <div className="pt-4 pb-3 border-t border-[#00132d]/20">
                  {isAuthenticated && user ? (
                    <div className="space-y-1">
                      <div className="flex items-center px-3 py-2">
                        <UserAvatar user={user} size="md" className="mr-3" />
                        <div>
                          <div className="text-base font-medium text-[#00132d]">{user.name}</div>
                          <div className="text-sm text-[#00132d]/60">@{user.username || user.email?.split('@')[0] || 'user'}</div>
                          <div className="text-xs text-[#00132d]/40">{user.email}</div>
                        </div>
                      </div>
                      <Link
                        href="/profile-simple"
                        onClick={(e) => {
                          handleNavigation('/profile-simple', e);
                          setIsMenuOpen(false);
                        }}
                        className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                      >
                        {t('myProfile')}
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Link
                        href="/login"
                        onClick={(e) => {
                          handleNavigation('/login', e);
                          setIsMenuOpen(false);
                        }}
                        className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href="/register"
                        onClick={(e) => {
                          handleNavigation('/register', e);
                          setIsMenuOpen(false);
                        }}
                        className="block pl-3 pr-4 py-2 text-base font-medium bg-[#00132d] text-[#fff7d7] rounded-md mx-3 hover:bg-[#00132d]/90 transition-colors"
                      >
                        {t('register')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}