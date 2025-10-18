import React from 'react';

interface FlagProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

// Brazil Flag
export const BrazilFlag: React.FC<FlagProps> = ({ className = '', size = 'md' }) => (
  <div className={`${sizeClasses[size]} ${className} rounded-sm overflow-hidden border border-gray-200`}>
    <svg viewBox="0 0 20 14" className="w-full h-full">
      <rect width="20" height="14" fill="#009739"/>
      <polygon points="10,2 18,7 10,12 2,7" fill="#FEDD00"/>
      <circle cx="10" cy="7" r="3" fill="#012169"/>
      <path d="M7,6 Q10,4 13,6 Q10,8 7,6" fill="#FEDD00"/>
    </svg>
  </div>
);

// US Flag
export const USFlag: React.FC<FlagProps> = ({ className = '', size = 'md' }) => (
  <div className={`${sizeClasses[size]} ${className} rounded-sm overflow-hidden border border-gray-200`}>
    <svg viewBox="0 0 20 14" className="w-full h-full">
      <rect width="20" height="14" fill="#B22234"/>
      <rect width="20" height="1" y="1" fill="white"/>
      <rect width="20" height="1" y="3" fill="white"/>
      <rect width="20" height="1" y="5" fill="white"/>
      <rect width="20" height="1" y="7" fill="white"/>
      <rect width="20" height="1" y="9" fill="white"/>
      <rect width="20" height="1" y="11" fill="white"/>
      <rect width="20" height="1" y="13" fill="white"/>
      <rect width="8" height="7" fill="#3C3B6E"/>
    </svg>
  </div>
);

// Spain Flag
export const SpainFlag: React.FC<FlagProps> = ({ className = '', size = 'md' }) => (
  <div className={`${sizeClasses[size]} ${className} rounded-sm overflow-hidden border border-gray-200`}>
    <svg viewBox="0 0 20 14" className="w-full h-full">
      <rect width="20" height="14" fill="#C60B1E"/>
      <rect width="20" height="8" y="3" fill="#FFC400"/>
    </svg>
  </div>
);

// France Flag
export const FranceFlag: React.FC<FlagProps> = ({ className = '', size = 'md' }) => (
  <div className={`${sizeClasses[size]} ${className} rounded-sm overflow-hidden border border-gray-200`}>
    <svg viewBox="0 0 20 14" className="w-full h-full">
      <rect width="6.67" height="14" fill="#002395"/>
      <rect width="6.67" height="14" x="6.67" fill="white"/>
      <rect width="6.67" height="14" x="13.33" fill="#ED2939"/>
    </svg>
  </div>
);

// EU Flag
export const EUFlag: React.FC<FlagProps> = ({ className = '', size = 'md' }) => (
  <div className={`${sizeClasses[size]} ${className} rounded-sm overflow-hidden border border-gray-200`}>
    <svg viewBox="0 0 20 14" className="w-full h-full">
      <rect width="20" height="14" fill="#003399"/>
      <g fill="#FFCC00">
        <circle cx="10" cy="4" r="0.5"/>
        <circle cx="12" cy="4.5" r="0.5"/>
        <circle cx="13" cy="6" r="0.5"/>
        <circle cx="12" cy="7.5" r="0.5"/>
        <circle cx="10" cy="8" r="0.5"/>
        <circle cx="8" cy="7.5" r="0.5"/>
        <circle cx="7" cy="6" r="0.5"/>
        <circle cx="8" cy="4.5" r="0.5"/>
      </g>
    </svg>
  </div>
);

// UK Flag
export const UKFlag: React.FC<FlagProps> = ({ className = '', size = 'md' }) => (
  <div className={`${sizeClasses[size]} ${className} rounded-sm overflow-hidden border border-gray-200`}>
    <svg viewBox="0 0 20 14" className="w-full h-full">
      <rect width="20" height="14" fill="#012169"/>
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="white" strokeWidth="1.5"/>
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#C8102E" strokeWidth="0.8"/>
      <rect width="20" height="2" y="6" fill="white"/>
      <rect width="2" height="14" x="9" fill="white"/>
      <rect width="20" height="1.2" y="6.4" fill="#C8102E"/>
      <rect width="1.2" height="14" x="9.4" fill="#C8102E"/>
    </svg>
  </div>
);

// Generic flag component that maps country codes to flag components
export const CountryFlag: React.FC<FlagProps & { country: string }> = ({ country, ...props }) => {
  switch (country.toUpperCase()) {
    case 'BR':
    case 'PT-BR':
      return <BrazilFlag {...props} />;
    case 'US':
    case 'EN-US':
      return <USFlag {...props} />;
    case 'ES':
    case 'ES-ES':
      return <SpainFlag {...props} />;
    case 'FR':
    case 'FR-FR':
      return <FranceFlag {...props} />;
    case 'EU':
      return <EUFlag {...props} />;
    case 'UK':
    case 'GB':
      return <UKFlag {...props} />;
    default:
      return (
        <div className={`${sizeClasses[props.size || 'md']} ${props.className} rounded-sm bg-gray-200 border border-gray-300 flex items-center justify-center`}>
          <span className="text-xs text-gray-500">{country.slice(0, 2).toUpperCase()}</span>
        </div>
      );
  }
};