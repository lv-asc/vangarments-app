import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { PWAInstaller } from '@/components/ui/PWAInstaller';
import { PWAProvider } from '@/components/providers/PWAProvider';



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
    default: 'Vangarments - Sua Plataforma de Moda Digital',
    template: '%s | Vangarments',
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
    'looks',
    'outfit',
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
    title: 'Vangarments - Sua Plataforma de Moda Digital',
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
    title: 'Vangarments - Sua Plataforma de Moda Digital',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/logo.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vangarments" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <ErrorBoundary>
          <PWAProvider>
            <Providers>
              {children}
              <PWAInstaller />
            </Providers>
          </PWAProvider>
        </ErrorBoundary>
        
        {/* Development Mode Initialization */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize development mode
              if (typeof window !== 'undefined') {
                localStorage.setItem('devMode', 'true');
                console.log('🚀 Development mode enabled');
                
                // Debug navigation
                console.log('🔧 Navigation debug enabled');
                window.addEventListener('click', function(e) {
                  if (e.target.tagName === 'A' || e.target.closest('a')) {
                    console.log('🔗 Link clicked:', e.target.href || e.target.closest('a').href);
                  }
                  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    console.log('🔘 Button clicked:', e.target);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}