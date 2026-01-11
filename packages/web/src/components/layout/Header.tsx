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
  ShieldCheckIcon,
  Square3Stack3DIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  SwatchIcon,
  BellIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';
import { Navigation } from './Navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTranslation } from '@/utils/translations';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { useNotifications } from '@/contexts/NotificationContext';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
// import { useRecentPages } from '@/components/providers/RecentPagesProvider'; // Removed unused import

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { navigate, currentPath, isNavigating } = useNavigation();
  const { t } = useTranslation();
  const {
    unreadNotificationCount,
    unreadMessageCount,
    notificationPreferences
  } = useNotifications();
  /* const { recentPages } = useRecentPages(); */ // Removed unused hook

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
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'Social', href: '/social', icon: UserGroupIcon },
    { name: t('wardrobe'), href: '/wardrobe', icon: TagIcon },
    { name: 'Outfits', href: '/outfits', icon: SparklesIcon },
    { name: 'Design Studio', href: '/design-studio', icon: SwatchIcon },
    { name: t('marketplace'), href: '/marketplace', icon: ShoppingBagIcon },
    { name: 'DMs', href: '/messages', icon: ChatBubbleLeftRightIcon },
  ];

  if (user?.roles?.includes('admin')) {
    navigation.push({ name: 'Admin', href: '/admin', icon: ShieldCheckIcon });
  }

  const entityNavigation = [];
  if (user?.linkedEntities) {
    if (user.linkedEntities.hasBrand) {
      entityNavigation.push({ name: 'My Brands', href: '/admin?tab=brands', icon: BuildingStorefrontIcon });
    }
    if (user.linkedEntities.hasStore) {
      entityNavigation.push({ name: 'My Stores', href: '/admin/stores', icon: ArchiveBoxIcon });
    }
    if (user.linkedEntities.hasPage) {
      entityNavigation.push({ name: 'My Pages', href: '/admin/pages', icon: DocumentTextIcon });
    }
    if (user.linkedEntities.hasSupplier) {
      entityNavigation.push({ name: 'My Suppliers', href: '/admin/suppliers', icon: ClipboardDocumentCheckIcon });
    }
    if (user.linkedEntities.hasPost) {
      entityNavigation.push({
        name: 'My Posts',
        href: `/u/${user.username || user.email?.split('@')[0] || 'user'}?tab=posts`,
      });
    }
  }

  const searchEntities = [
    { name: 'Brands', href: '/brands', icon: BuildingStorefrontIcon },
    { name: 'Stores', href: '/stores', icon: ArchiveBoxIcon },
    { name: 'Suppliers', href: '/suppliers', icon: ClipboardDocumentCheckIcon },
    { name: 'Non Profits', href: '/non-profits', icon: HeartIcon },
    { name: 'Pages', href: '/pages', icon: DocumentTextIcon },
  ];

  /* const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  }; */ // Moved to Profile Page

  const closeMenu = () => {
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

          <div className="ml-10 hidden space-x-6 lg:flex items-center">
            {navigation.map((link) => {
              const isActive = currentPath === link.href;
              const isSearch = link.name === 'Search';

              const content = (
                <div className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  } ${isSearch && isSearchOpen ? 'text-primary bg-primary/10' : ''}`}>
                  <div className="relative">
                    <link.icon className="h-5 w-5" />
                    {link.href === '/messages' && notificationPreferences.showMessageBadge && unreadMessageCount > 0 && (
                      <NotificationBadge
                        count={unreadMessageCount}
                        show={true}
                        size="sm"
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium">{link.name}</span>
                </div>
              );

              if (isSearch) {
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setIsSearchOpen(true)}
                    onMouseLeave={() => setIsSearchOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={isNavigating ? 'opacity-50 pointer-events-none' : ''}
                    >
                      {content}
                    </Link>

                    <AnimatePresence>
                      {isSearchOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl py-2 z-50 overflow-hidden"
                        >
                          <div className="px-3 py-2 mb-1 border-b border-border/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Quick Search</span>
                          </div>
                          {searchEntities.map((entity) => (
                            <Link
                              key={entity.name}
                              href={entity.href}
                              className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                            >
                              <entity.icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                              <span>{entity.name}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={isNavigating ? 'opacity-50 pointer-events-none' : ''}
                  title={link.name}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          {/* Desktop User Menu or Auth Buttons */}
          <div className="ml-10 hidden lg:flex items-center space-x-4">
            {/* Recent Pages Dropdown Removed */}

            {/* LanguageSelector Removed */}

            {isAuthenticated && user ? (
              <>
                {entityNavigation.length > 0 && (
                  <div className="relative">
                    <button
                      onMouseEnter={() => setIsManagementOpen(true)}
                      onMouseLeave={() => setIsManagementOpen(false)}
                      className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-muted-foreground hover:text-primary hover:bg-muted ${isManagementOpen ? 'text-primary bg-primary/10' : ''}`}
                    >
                      <Square3Stack3DIcon className="h-5 w-5" />
                      <span className="text-xs font-medium">Manage</span>

                      <AnimatePresence>
                        {isManagementOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl py-2 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-2 mb-1 border-b border-border/50">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Entities</span>
                            </div>
                            {entityNavigation.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                              >
                                <link.icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                                <span>{link.name}</span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                )}

                <div className="relative flex items-center space-x-3">
                  {/* Notification Bell */}
                  <Link
                    href="/notifications"
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors relative"
                    title="Notifications"
                  >
                    <BellIcon className="h-6 w-6" />
                    <NotificationBadge
                      count={unreadNotificationCount}
                      show={notificationPreferences.showNotificationBadge}
                    />
                  </Link>

                  {/* Profile Link */}
                  <Link
                    href={`/u/${user.username || user.email?.split('@')[0] || 'user'}`}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <UserAvatar user={user} size="sm" />
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{user.name}</span>
                      {user.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                    </div>
                    <span className="text-sm text-muted-foreground">@{user.username || user.email?.split('@')[0] || 'user'}</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="inline-block bg-muted py-2 px-4 border border-border rounded-md text-base font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
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
                  const isSearch = link.name === 'Search';

                  return (
                    <div key={link.name}>
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        className={`flex items-center space-x-3 pl-3 pr-4 py-2 text-base font-medium transition-colors ${isActive
                          ? 'text-[#00132d] bg-[#00132d]/10'
                          : 'text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5'
                          } ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <link.icon className="h-5 w-5" />
                        <span>{link.name}</span>
                      </Link>

                      {isSearch && (
                        <div className="pl-8 space-y-1 mt-1 mb-2">
                          {searchEntities.map((entity) => (
                            <Link
                              key={entity.name}
                              href={entity.href}
                              onClick={closeMenu}
                              className="flex items-center space-x-3 py-2 text-sm font-medium text-[#00132d]/60 hover:text-[#00132d] transition-colors"
                            >
                              <entity.icon className="h-4 w-4" />
                              <span>{entity.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="pt-4 pb-3 border-t border-[#00132d]/20">
                  {isAuthenticated && user ? (
                    <div className="space-y-1">
                      <div className="flex items-center px-3 py-2">
                        <UserAvatar user={user} size="md" className="mr-3" />
                        <div>
                          <div className="flex items-center gap-1">
                            <div className="text-base font-medium text-[#00132d]">{user.name}</div>
                            {user.verificationStatus === 'verified' && <VerifiedBadge size="xs" />}
                          </div>
                          <div className="text-sm text-[#00132d]/60">@{user.username || user.email?.split('@')[0] || 'user'}</div>
                          <div className="text-xs text-[#00132d]/40">{user.email}</div>
                        </div>
                      </div>
                      <Link
                        href={`/u/${user.username || user.email?.split('@')[0] || 'user'}`}
                        onClick={closeMenu}
                        className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                      >
                        {t('myProfile')}
                      </Link>

                      {/* Linked Entities (Mobile) */}
                      {entityNavigation.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={closeMenu}
                          className="flex items-center space-x-3 pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                        >
                          <link.icon className="h-5 w-5" />
                          <span>{link.name}</span>
                        </Link>
                      ))}
                      <button
                        onClick={async () => {
                          await logout();
                          closeMenu();
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
                        onClick={closeMenu}
                        className="block pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href="/register"
                        onClick={closeMenu}
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