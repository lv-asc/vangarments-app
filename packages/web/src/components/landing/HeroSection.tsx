'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { useTranslation } from '@/utils/translations';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="relative bg-gradient-to-br from-[#fff7d7] via-white to-[#fff7d7] overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00132d]/10 to-[#00132d]/5" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
              {t('heroTitle')}{' '}
              <span className="relative whitespace-nowrap text-[#00132d]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute top-2/3 left-0 h-[0.58em] w-full fill-[#00132d]/30"
                  preserveAspectRatio="none"
                >
                  <path d="m203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span className="relative">{t('heroHighlight')}</span>
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-700">
              {t('heroDescription')}
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center rounded-full py-3 px-6 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-[#00132d] text-[#fff7d7] hover:bg-[#00132d]/90 active:bg-[#00132d]/80 focus-visible:outline-[#00132d]"
              >
                {t('getStarted')}
              </Link>
              <Link
                href="#features"
                className="group inline-flex ring-1 items-center justify-center rounded-full py-3 px-6 text-sm focus:outline-none ring-[#00132d]/20 text-[#00132d] hover:text-[#00132d] hover:ring-[#00132d]/30 active:bg-[#00132d]/5 active:text-[#00132d] focus-visible:outline-[#00132d] focus-visible:ring-[#00132d]/30"
              >
                <span>{t('learnMore')}</span>
                <ChevronRightIcon className="ml-3 h-3 w-3 stroke-current" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 lg:mt-20"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="relative rounded-xl bg-[#00132d]/5 p-2 ring-1 ring-inset ring-[#00132d]/10 lg:rounded-2xl lg:p-4">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-[#fff7d7] to-[#fff7d7]/50 shadow-2xl ring-1 ring-[#00132d]/10">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto h-16 w-16 bg-[#00132d] rounded-full flex items-center justify-center mb-4">
                        <span className="text-[#fff7d7] font-bold text-2xl">V</span>
                      </div>
                      <p className="text-[#00132d]/70 font-medium">
                        {t('appPreview')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}