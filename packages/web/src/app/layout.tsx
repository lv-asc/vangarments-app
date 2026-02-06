import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { PWAInstaller } from '@/components/ui/PWAInstaller';
import { PWAProvider } from '@/components/providers/PWAProvider';
import { Header } from '@/components/layout/Header';
import { RecentPagesProvider } from '@/components/providers/RecentPagesProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ContentProvider } from '@/contexts/ContentContext';
import Script from 'next/script';



const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Vangs | Home',
    template: '%s',
  },
  description: 'Organize seu guarda-roupa, descubra tendências e conecte-se com a comunidade da moda brasileira.',
  keywords: [
    'moda',
    'guarda-roupa digital',
    'fashion',
    'estilo',
    'tendências',
    'brasil',
    'roupas',
    'styling',
  ],
  authors: [{ name: 'Vangarments Team' }],
  creator: 'Vangarments',
  publisher: 'Vangarments',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vangarments.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'Vangarments | Sua Plataforma de Moda Digital',
    description: 'Organize seu guarda-roupa, descubra tendências e conecte-se com a comunidade da moda brasileira.',
    siteName: 'Vangarments',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vangarments - Plataforma de Moda Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vangarments | Sua Plataforma de Moda Digital',
    description: 'Organize seu guarda-roupa, descubra tendências e conecte-se com a comunidade da moda brasileira.',
    images: ['/og-image.jpg'],
    creator: '@vangarments',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vangarments" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <ErrorBoundary>
          <PWAProvider>
            <Providers>
              <NotificationProvider>
                <ContentProvider>
                  <RecentPagesProvider>
                    <Header />
                    <main className="min-h-screen pt-8">
                      {children}
                    </main>
                    <PWAInstaller />
                  </RecentPagesProvider>
                </ContentProvider>
              </NotificationProvider>
            </Providers>
          </PWAProvider>
        </ErrorBoundary>

        {/* Google Maps API */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}