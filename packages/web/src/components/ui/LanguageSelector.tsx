// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      const lang = languages.find(l => l.code === savedLang);
      if (lang) {
        setCurrentLanguage(lang);
      }
    } else {
      // Set default to English if no language is saved
      setCurrentLanguage(languages[0]); // English is now first
      localStorage.setItem('language', 'en');
    }
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language.code);
    setIsOpen(false);

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('languageChange', {
      detail: { language: language.code }
    }));

    console.log('🌐 Language changed to:', language.name);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-[#00132d]/80 hover:text-[#00132d] transition-colors"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#fff7d7]/50 transition-colors flex items-center space-x-3 ${currentLanguage.code === language.code
                  ? 'bg-[#fff7d7]/30 text-[#00132d] font-medium'
                  : 'text-gray-700'
                }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}