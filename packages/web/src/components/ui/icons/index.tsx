import React from 'react';

interface IconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

// Success/Check Icon
export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// Error/X Icon
export const XIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Warning Icon
export const WarningIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

// Trophy/Award Icon
export const TrophyIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2L7.5 7H2l4.5 3.5L5 16l5-3 5 3-1.5-5.5L18 7h-5.5L10 2z" clipRule="evenodd" />
  </svg>
);

// Target/Goal Icon
export const TargetIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

// Chart/Analytics Icon
export const ChartIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

// Lightning/Energy Icon
export const LightningIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
);

// Gift/Present Icon
export const GiftIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0115 5a3 3 0 013 3v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a3 3 0 013-3zm4 2.236A3 3 0 0110 5a3 3 0 011 2.236V16H9V7.236z" clipRule="evenodd" />
  </svg>
);

// Medal/Badge Icon
export const MedalIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

// Share Icon
export const ShareIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
  </svg>
);

// Eye/View Icon
export const EyeIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

// Sparkles/Premium Icon
export const SparklesIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 1a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 5.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-5.456A1 1 0 0112 1z" clipRule="evenodd" />
  </svg>
);

// Clock/Time Icon
export const ClockIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

// Document/Clipboard Icon
export const DocumentIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

// Info Icon
export const InfoIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

// Megaphone/Announcement Icon
export const MegaphoneIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd" />
  </svg>
);

// Leaf/Eco Icon
export const LeafIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2 10.5a1.5 1.5 0 113 0V12a7 7 0 0014 0c0-5.38-3.62-9.92-8.5-11.5C5.62 2.08 2 6.62 2 12v-1.5z" clipRule="evenodd" />
    <path d="M6 15.5A1.5 1.5 0 017.5 14h.5c.55 0 1 .45 1 1s-.45 1-1 1h-.5A1.5 1.5 0 016 15.5z" />
  </svg>
);