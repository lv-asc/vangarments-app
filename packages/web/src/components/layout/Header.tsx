// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
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
  HeartIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  FireIcon,
  UsersIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ChevronDownIcon
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
import SwitchAccountModal from '@/components/profile/SwitchAccountModal';
// import { useRecentPages } from '@/components/providers/RecentPagesProvider'; // Removed unused import
import { AnteroomAPI } from '@/lib/anteroomApi';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, activeAccount, setActiveAccount, isSwitchAccountModalOpen, setIsSwitchAccountModalOpen } = useAuth();
  const { navigate, currentPath, isNavigating } = useNavigation();
  const { t } = useTranslation();
  const {
    unreadNotificationCount,
    unreadMessageCount,
    notificationPreferences
  } = useNotifications();
  const [anteroomCount, setAnteroomCount] = useState(0);
  /* const { recentPages } = useRecentPages(); */ // Removed unused hook
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

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

  // Fetch anteroom count for badge
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        const result = await AnteroomAPI.getItemCount();
        setAnteroomCount(result.current);
      } catch (error) {
        console.error('Failed to fetch anteroom count in Header:', error);
      }
    };
    fetchCount();
  }, [isAuthenticated]);

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
    { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
  ];

  if (user?.roles?.includes('admin')) {
    navigation.push({ name: 'Admin', href: '/admin', icon: ShieldCheckIcon });
  }

  const entityNavigation = [];
  if (user?.linkedEntities) {
    // Brands
    user.linkedEntities.brands?.forEach((brand: any) => {
      entityNavigation.push({
        name: brand.name,
        href: `/admin/brands/${brand.id}`,
        icon: BuildingStorefrontIcon,
        logo: brand.logo
      });
    });

    // Stores
    user.linkedEntities.stores?.forEach((store: any) => {
      entityNavigation.push({
        name: store.name,
        href: `/admin/stores/${store.id}`,
        icon: ArchiveBoxIcon,
        logo: store.logo
      });
    });

    // Pages
    user.linkedEntities.pages?.forEach((page: any) => {
      entityNavigation.push({
        name: page.name,
        href: `/admin/pages/${page.id}`,
        icon: DocumentTextIcon,
        logo: page.logo
      });
    });

    // Suppliers
    user.linkedEntities.suppliers?.forEach((supplier: any) => {
      entityNavigation.push({
        name: supplier.name,
        href: `/admin/suppliers/${supplier.id}`,
        icon: ClipboardDocumentCheckIcon
      });
    });

    // Posts
    if (user.linkedEntities.hasPost) {
      entityNavigation.push({
        name: 'My Posts',
        href: `/u/${user.username || user.email?.split('@')[0] || 'user'}?tab=posts`,
        icon: DocumentTextIcon
      });
    }
  }

  const searchEntities = [
    { name: 'Items', href: '/items', icon: ShoppingBagIcon },
    { name: 'Brands', href: '/brands', icon: FireIcon },
    { name: 'Stores', href: '/stores', icon: BuildingStorefrontIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Posts', href: '/search?tab=post', icon: ChatBubbleLeftRightIcon },
    { name: 'Pages', href: '/pages', icon: RectangleStackIcon },
    { name: 'Sport ORGs', href: '/sport-orgs', icon: UserGroupIcon },
    { name: 'Non Profits', href: '/non-profits', icon: HeartIcon },
    { name: 'Suppliers', href: '/suppliers', icon: ClipboardDocumentCheckIcon },
    { name: 'Events', href: '/events', icon: CalendarDaysIcon },
  ];

  /* const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  }; */ // Moved to Profile Page

  const closeMenu = () => {
    setIsMenuOpen(false);
  };



  const isHome = currentPath === '/';
  const isAnyMenuOpen = isMenuOpen || isManagementOpen || isSearchOpen || isWardrobeOpen || isUserMenuOpen;
  const isHeaderVisible = isHome || isHeaderHovered || isAnyMenuOpen;

  return (
    <>
      {!isHome && (
        <div
          className={`fixed top-0 left-1/2 -translate-x-1/2 z-40 flex justify-center items-start transition-opacity duration-300 ${isHeaderVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onMouseEnter={() => setIsHeaderHovered(true)}
        >
          <div className="w-16 h-6 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-b-lg border-b border-x border-border/30 shadow-sm cursor-pointer">
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      <header
        className={`bg-background/80 backdrop-blur-md shadow-sm z-50 border-b border-border transition-transform duration-300 ${isHome
          ? 'sticky top-0'
          : `fixed top-0 left-0 right-0 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`
          }`}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between py-3">
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center">
                <img
                  src="/assets/images/logo-header.svg"
                  alt="Vangarments"
                  className="h-10 w-auto object-contain"
                  style={{ filter: 'brightness(0)' }}
                />
              </Link>
            </div>

            <div className="ml-6 hidden space-x-4 lg:flex items-center">
              {navigation.map((link) => {
                const isActive = currentPath === link.href;
                const isSearch = link.name === 'Search';

                const content = (
                  <div className={`flex flex-col items-center justify-center space-y-1 p-1.5 rounded-lg transition-colors min-w-[64px] ${isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                    } ${isSearch && isSearchOpen ? 'text-primary bg-primary/10' : ''}`}>
                    <div className="relative flex items-center justify-center h-5 w-5">
                      <link.icon className="h-5 w-5 shrink-0" />
                      {link.href === '/messages' && notificationPreferences.showMessageBadge && unreadMessageCount > 0 && (
                        <NotificationBadge
                          count={unreadMessageCount}
                          show={true}
                          size="sm"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">{link.name}</span>
                  </div>
                );

                const isWardrobe = link.name === t('wardrobe');

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

                if (isWardrobe) {
                  return (
                    <div
                      key={link.name}
                      className="relative"
                      onMouseEnter={() => setIsWardrobeOpen(true)}
                      onMouseLeave={() => setIsWardrobeOpen(false)}
                    >
                      <Link
                        href={link.href}
                        className={isNavigating ? 'opacity-50 pointer-events-none' : ''}
                      >
                        {content}
                      </Link>

                      <AnimatePresence>
                        {isWardrobeOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl py-2 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-2 mb-1 border-b border-border/10">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Wardrobe Sections</span>
                            </div>
                            <Link
                              href="/wardrobe"
                              className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                              onClick={() => setIsWardrobeOpen(false)}
                            >
                              <ArchiveBoxIcon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                              <span>Complete Wardrobe</span>
                            </Link>
                            <Link
                              href="/wardrobe?tab=anteroom"
                              className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                              onClick={() => setIsWardrobeOpen(false)}
                            >
                              <div className="relative">
                                <ClockIcon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                                {anteroomCount > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                  </span>
                                )}
                              </div>
                              <span>Anteroom</span>
                            </Link>
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
            <div className="ml-6 hidden lg:flex items-center space-x-3">
              {/* Recent Pages Dropdown Removed */}

              {/* LanguageSelector Removed */}

              {isAuthenticated && user ? (
                <>
                  {entityNavigation.length > 0 && (
                    <div className="relative">
                      <button
                        onMouseEnter={() => setIsManagementOpen(true)}
                        onMouseLeave={() => setIsManagementOpen(false)}
                        className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-colors min-w-[72px] text-muted-foreground hover:text-primary hover:bg-muted ${isManagementOpen ? 'text-primary bg-primary/10' : ''}`}
                      >
                        <div className="relative flex items-center justify-center h-5 w-5">
                          <Square3Stack3DIcon className="h-5 w-5 shrink-0" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">Manage</span>

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
                                  {link.logo ? (
                                    <img
                                      src={link.logo}
                                      alt={link.name}
                                      className="h-4 w-4 rounded-full object-cover shrink-0 border border-border"
                                    />
                                  ) : (
                                    link.icon && <link.icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                                  )}
                                  <span className="truncate">{link.name}</span>
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

                    {/* Profile & User Menu */}
                    <div
                      className="relative"
                      onMouseEnter={() => setIsUserMenuOpen(true)}
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <Link
                        href={`/u/${user.username || user.email?.split('@')[0] || 'user'}`}
                        className={`flex items-center space-x-2 p-1.5 rounded-lg transition-colors ${isUserMenuOpen ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        <UserAvatar user={user} size="sm" />
                        <div className="hidden xl:flex flex-col items-start leading-tight">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm">{user.name}</span>
                            {user.verificationStatus === 'verified' && <VerifiedBadge size="xxs" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">@{user.username || user.email?.split('@')[0] || 'user'}</span>
                        </div>
                      </Link>

                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-xl py-2 z-50 overflow-hidden"
                          >
                            {/* User Info Header in Dropdown */}
                            <div className="px-4 py-3 border-b border-border/50 bg-muted/30 mb-1">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Personal Account</p>
                              <p className="text-sm font-semibold truncate flex items-center gap-1">
                                {user.name}
                                {user.verificationStatus === 'verified' && <VerifiedBadge size="xs" />}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">@{user.username || user.email?.split('@')[0] || 'user'}</p>
                            </div>

                            {/* Edit Profile Option */}
                            <Link
                              href={`/u/${user.username || user.email?.split('@')[0] || 'user'}`}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <UserCircleIcon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                              <span>Edit Profile</span>
                            </Link>

                            {/* Settings Option */}
                            <Link
                              href="/settings"
                              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Cog6ToothIcon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                              <span>Settings</span>
                            </Link>

                            {/* Switch Account Option */}
                            <button
                              onClick={() => {
                                setIsSwitchAccountModalOpen(true);
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
                            >
                              <ArrowPathIcon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                              <span>Switch Account</span>
                            </button>

                            {/* Sign Out Option */}
                            <button
                              onClick={async () => {
                                await logout();
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/5 transition-colors group border-t border-border/10 mt-1"
                            >
                              <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-500/60 group-hover:text-red-500 transition-colors" />
                              <span>Sign Out</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
                    const isWardrobe = link.name === t('wardrobe');

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

                        {isWardrobe && (
                          <div className="pl-8 space-y-1 mt-1 mb-2">
                            <Link
                              href="/wardrobe"
                              onClick={closeMenu}
                              className="flex items-center space-x-3 py-2 text-sm font-medium text-[#00132d]/60 hover:text-[#00132d] transition-colors"
                            >
                              <ArchiveBoxIcon className="h-4 w-4" />
                              <span>Complete Wardrobe</span>
                            </Link>
                            <Link
                              href="/wardrobe?tab=anteroom"
                              onClick={closeMenu}
                              className="flex items-center space-x-3 py-2 text-sm font-medium text-[#00132d]/60 hover:text-[#00132d] transition-colors"
                            >
                              <div className="relative">
                                <ClockIcon className="h-4 w-4" />
                                {anteroomCount > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                  </span>
                                )}
                              </div>
                              <span>Anteroom</span>
                            </Link>
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
                              {user.verificationStatus === 'verified' && <VerifiedBadge size="xxs" />}
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
                            {link.logo ? (
                              <img
                                src={link.logo}
                                alt={link.name}
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              link.icon && <link.icon className="h-5 w-5" />
                            )}
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

        {/* Global Modals */}
        <SwitchAccountModal
          isOpen={isSwitchAccountModalOpen}
          onClose={() => setIsSwitchAccountModalOpen(false)}
          currentAccount={activeAccount}
          onSwitchAccount={setActiveAccount}
        />
      </header>
    </>
  );
}