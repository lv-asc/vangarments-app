import React, { useState, useEffect } from 'react';
import { ResponsiveNavigation, defaultNavigationItems } from '../navigation/MobileNavigation';
import { Container } from '../ui/DesignSystem';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showNavigation = true,
  containerSize = 'lg',
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <Container size={containerSize}>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Vangarments</h1>
            </div>

            {/* Desktop Navigation */}
            {showNavigation && (
              <ResponsiveNavigation items={defaultNavigationItems} />
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5V7a12 12 0 0124 0v10z" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${isMobile && showNavigation ? 'pb-20' : ''}`}>
        <Container size={containerSize} className="py-6">
          {children}
        </Container>
      </main>

      {/* Mobile Navigation */}
      {showNavigation && <ResponsiveNavigation items={defaultNavigationItems} />}
    </div>
  );
};

// Page wrapper with responsive layout
interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavigation?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  description,
  showNavigation = true,
  containerSize = 'lg',
  className = '',
}) => {
  return (
    <ResponsiveLayout
      showNavigation={showNavigation}
      containerSize={containerSize}
      className={className}
    >
      {(title || description) && (
        <div className="mb-8">
          {title && (
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 animate-fadeInUp">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600 text-lg animate-fadeInUp animate-stagger-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </ResponsiveLayout>
  );
};

// Grid layout for cards/items
interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: string;
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = '280px',
  gap = '1.5rem',
  className = '',
}) => {
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
};

// Responsive image gallery
interface ResponsiveGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  className?: string;
}

export const ResponsiveGallery: React.FC<ResponsiveGalleryProps> = ({
  images,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className = '',
}) => {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
      }}
    >
      <style jsx>{`
        @media (min-width: 640px) {
          div {
            grid-template-columns: repeat(${columns.tablet}, 1fr);
          }
        }
        @media (min-width: 1024px) {
          div {
            grid-template-columns: repeat(${columns.desktop}, 1fr);
          }
        }
      `}</style>
      {images.map((image, index) => (
        <div key={index} className="relative group">
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-auto rounded-lg shadow-md hover-lift transition-transform duration-300"
            loading="lazy"
          />
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm">{image.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Responsive sidebar layout
interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: string;
  collapsible?: boolean;
  className?: string;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  sidebar,
  sidebarPosition = 'left',
  sidebarWidth = '320px',
  collapsible = true,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen ${className}`}>
      {/* Mobile sidebar toggle */}
      {collapsible && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarPosition === 'left' ? 'order-1' : 'order-2'}
          lg:relative fixed inset-y-0 z-40 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:block
        `}
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <main
        className={`
          ${sidebarPosition === 'left' ? 'order-2' : 'order-1'}
          flex-1 overflow-hidden
        `}
      >
        {children}
      </main>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Responsive tabs component
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  defaultTab,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${activeTab === tab.id ? 'block animate-fadeIn' : 'hidden'}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};