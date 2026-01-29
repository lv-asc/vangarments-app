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
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthWrapper';

export function SimpleHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Dynamic profile URL - uses /u/username if authenticated, /login if not
  const profileHref = isAuthenticated && user?.username
    ? `/u/${user.username}`
    : '/login';

  const navigation = [
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'Wardrobe', href: '/wardrobe', icon: HomeIcon },

    { name: 'Profile', href: profileHref, icon: UserIcon },
  ];

  return (
    <header className="bg-[#fff7d7] shadow-sm sticky top-0 z-50 border-b border-[#00132d]/10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#00132d] rounded-full flex items-center justify-center">
                <span className="text-[#fff7d7] text-xl font-bold">V</span>
              </div>
              <span className="text-[#00132d] text-xl font-bold">Vangarments</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="ml-10 hidden space-x-6 lg:flex items-center">
            {navigation.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5"
                title={link.name}
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="bg-[#fff7d7] rounded-md p-2 inline-flex items-center justify-center text-[#00132d]/60 hover:text-[#00132d] hover:bg-[#00132d]/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00132d]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {navigation.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center space-x-3 pl-3 pr-4 py-2 text-base font-medium text-[#00132d]/80 hover:text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}