// @ts-nocheck
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
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';
import { Navigation } from './Navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTranslation } from '@/utils/translations';
import { useRecentPages } from '@/components/providers/RecentPagesProvider';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRecentPagesOpen, setIsRecentPagesOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { navigate, currentPath, isNavigating } = useNavigation();
  const { t } = useTranslation();
  const { recentPages } = useRecentPages();

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

  /* Swapped Icons: 
     - Wardrobe: TagIcon (closest to item/clothing) 
     - Outfits: SparklesIcon (represents 'Outfits'/Creation better than Eye) 
  */
  const navigation = [
    { name: t('discover'), href: '/discover', icon: MagnifyingGlassIcon },
    { name: 'Social', href: '/social', icon: UserGroupIcon },
    { name: t('wardrobe'), href: '/wardrobe', icon: TagIcon },
    { name: 'Outfits', href: '/outfits', icon: SparklesIcon },
    { name: t('marketplace'), href: '/marketplace', icon: ShoppingBagIcon },
    { name: 'DMs', href: '/messages', icon: ChatBubbleLeftRightIcon },
  ];

  if (user?.roles?.includes('admin')) {
    navigation.push({ name: 'Admin', href: '/admin', icon: ShieldCheckIcon });
  }

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
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-border">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-3">
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
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${isActive
                    ? 'text-primary bg-primary/10'
                    : link.special
                      ? 'text-primary hover:bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
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
            {/* Recent Pages Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRecentPagesOpen(!isRecentPagesOpen)}
                className="flex items-center p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                title="Recent Pages"
              >
                <ClockIcon className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {isRecentPagesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-card rounded-md shadow-lg py-1 z-50 border border-border"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Recent Pages</span>
                    </div>
                    {recentPages.length > 0 ? (
                      recentPages.slice(0, 5).map((page, idx) => (
                        <Link
                          key={idx}
                          href={page.path}
                          onClick={(e) => {
                            handleNavigation(page.path, e);
                            setIsRecentPagesOpen(false);
                          }}
                          className={`block px-4 py-2 text-sm hover:bg-muted truncate ${currentPath === page.path ? 'text-primary font-medium' : 'text-foreground'}`}
                        >
                          {page.title}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No recent pages
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <LanguageSelector />

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">@{user.username || user.email?.split('@')[0] || 'user'}</span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 border border-border"
                    >
                      <Link
                        href="/profile"
                        onClick={(e) => {
                          handleNavigation('/profile', e);
                          setIsUserMenuOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        {t('myProfile')}
                      </Link>

                      {/* Linked Entities */}
                      {user.linkedEntities?.hasBrand && (
                        <Link
                          href="/admin?tab=brands"
                          onClick={(e) => {
                            handleNavigation('/admin?tab=brands', e);
                            setIsUserMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          My Brands
                        </Link>
                      )}
                      {user.linkedEntities?.hasStore && (
                        <Link
                          href="/admin/stores"
                          onClick={(e) => {
                            handleNavigation('/admin/stores', e);
                            setIsUserMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          My Stores
                        </Link>
                      )}
                      {user.linkedEntities?.hasPage && (
                        <Link
                          href="/admin/pages"
                          onClick={(e) => {
                            handleNavigation('/admin/pages', e);
                            setIsUserMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          My Pages
                        </Link>
                      )}
                      {user.linkedEntities?.hasSupplier && (
                        <Link
                          href="/admin/suppliers"
                          onClick={(e) => {
                            handleNavigation('/admin/suppliers', e);
                            setIsUserMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          My Suppliers
                        </Link>
                      )}
                      {user.linkedEntities?.hasPost && (
                        <Link
                          href="/profile?tab=posts"
                          onClick={(e) => {
                            handleNavigation('/profile?tab=posts', e);
                            setIsUserMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          My Posts
                        </Link>
                      )}

                      {user.roles && user.roles.includes('admin') && (
                        <Link
                          href="/admin"
                          onClick={(e) => {
                            handleNavigation('/admin', e);
                            setIsUserMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/wardrobe"
                        onClick={(e) => {
                          handleNavigation('/wardrobe', e);
                          setIsUserMenuOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        {t('myWardrobe')}
                      </Link>
                      <div className="border-t border-border"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
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
                  className="inline-block bg-muted py-2 px-4 border border-border rounded-md text-base font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={(e) => handleNavigation('/register', e)}
                  className="inline-block bg-primary py-2 px-4 border border-transparent rounded-md text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
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
              className="bg-background rounded-md p-2 inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
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
                      className={`flex items-center space-x-3 pl-3 pr-4 py-2 text-base font-medium transition-colors ${isActive
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
                        href="/profile"
                        onClick={(e) => {
                          handleNavigation('/profile', e);
                          setIsMenuOpen(false);
                        }}
                        className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                      >
                        {t('myProfile')}
                      </Link>

                      {/* Linked Entities (Mobile) */}
                      {user.linkedEntities?.hasBrand && (
                        <Link
                          href="/admin?tab=brands"
                          onClick={(e) => {
                            handleNavigation('/admin?tab=brands', e);
                            setIsMenuOpen(false);
                          }}
                          className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                        >
                          My Brands
                        </Link>
                      )}
                      {user.linkedEntities?.hasStore && (
                        <Link
                          href="/admin/stores"
                          onClick={(e) => {
                            handleNavigation('/admin/stores', e);
                            setIsMenuOpen(false);
                          }}
                          className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                        >
                          My Stores
                        </Link>
                      )}
                      {user.linkedEntities?.hasPage && (
                        <Link
                          href="/admin/pages"
                          onClick={(e) => {
                            handleNavigation('/admin/pages', e);
                            setIsMenuOpen(false);
                          }}
                          className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                        >
                          My Pages
                        </Link>
                      )}
                      {user.linkedEntities?.hasSupplier && (
                        <Link
                          href="/admin/suppliers"
                          onClick={(e) => {
                            handleNavigation('/admin/suppliers', e);
                            setIsMenuOpen(false);
                          }}
                          className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                        >
                          My Suppliers
                        </Link>
                      )}
                      {user.linkedEntities?.hasPost && (
                        <Link
                          href="/profile?tab=posts"
                          onClick={(e) => {
                            handleNavigation('/profile?tab=posts', e);
                            setIsMenuOpen(false);
                          }}
                          className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                        >
                          My Posts
                        </Link>
                      )}
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