// Simple translation system for basic UI elements
import { useState, useEffect } from 'react';

export const translations = {
  pt: {
    // Navigation
    discover: 'Descobrir',
    wardrobe: 'Guarda-roupa',
    looks: 'Looks',
    marketplace: 'Marketplace',
    analytics: 'Analytics',
    advertising: 'Advertising',


    // Auth
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',

    // Profile
    myProfile: 'Meu Perfil',
    myWardrobe: 'Meu Guarda-roupa',
    editProfile: 'Editar Perfil',

    // Hero Section
    heroTitle: 'Organize seu',
    heroHighlight: 'guarda-roupa',
    heroDescription: 'A primeira plataforma brasileira que combina catalogação inteligente, rede social e marketplace de moda. Descubra, organize e expresse seu estilo pessoal.',
    getStarted: 'Começar gratuitamente',
    learnMore: 'Ver como funciona',
    appPreview: 'Interface da aplicação',

    // Common
    save: 'Salvar',
    cancel: 'Cancelar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
  },
  en: {
    // Navigation
    discover: 'Discover',
    wardrobe: 'Wardrobe',
    looks: 'Looks',
    marketplace: 'Marketplace',
    analytics: 'Analytics',
    advertising: 'Advertising',


    // Auth
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',

    // Profile
    myProfile: 'My Profile',
    myWardrobe: 'My Wardrobe',
    editProfile: 'Edit Profile',

    // Hero Section
    heroTitle: 'Organize your',
    heroHighlight: 'wardrobe',
    heroDescription: 'The first Brazilian platform that combines intelligent cataloging, social network and fashion marketplace. For everyone who wants to discover, organize and express their personal style.',
    getStarted: 'Get Started Free',
    learnMore: 'Learn More',
    appPreview: 'Application Interface',

    // CTA Section
    ctaTitle: 'Your fashion journey starts now',
    ctaSubtitle: 'Join thousands of people who have already discovered a new way to organize, express and monetize their personal style.',
    ctaBenefits: {
      free: '100% Free to start',
      community: 'Active and welcoming community',
      technology: 'Cutting-edge technology'
    },

    // Common
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  es: {
    // Navigation
    discover: 'Descubrir',
    wardrobe: 'Guardarropa',
    looks: 'Looks',
    marketplace: 'Marketplace',
    analytics: 'Analytics',
    advertising: 'Publicidad',


    // Auth
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',

    // Profile
    myProfile: 'Mi Perfil',
    myWardrobe: 'Mi Guardarropa',
    editProfile: 'Editar Perfil',

    // Hero Section
    heroTitle: 'Organiza tu',
    heroHighlight: 'guardarropa',
    heroDescription: 'La primera plataforma brasileña que combina catalogación inteligente, red social y marketplace de moda. Descubre, organiza y monetiza tu estilo.',
    getStarted: 'Comenzar Gratis',
    learnMore: 'Saber Más',
    appPreview: 'Interfaz de la Aplicación',

    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
  fr: {
    // Navigation
    discover: 'Découvrir',
    wardrobe: 'Garde-robe',
    looks: 'Looks',
    marketplace: 'Marketplace',
    analytics: 'Analytics',
    advertising: 'Publicité',


    // Auth
    login: 'Connexion',
    register: 'S\'inscrire',
    logout: 'Déconnexion',

    // Profile
    myProfile: 'Mon Profil',
    myWardrobe: 'Ma Garde-robe',
    editProfile: 'Modifier le Profil',

    // Hero Section
    heroTitle: 'Organisez votre',
    heroHighlight: 'garde-robe',
    heroDescription: 'La première plateforme brésilienne qui combine catalogage intelligent, réseau social et marketplace de mode. Découvrez, organisez et monétisez votre style.',
    getStarted: 'Commencer Gratuitement',
    learnMore: 'En Savoir Plus',
    appPreview: 'Interface de l\'Application',

    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
};

export type Language = keyof typeof translations;



export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('language') as Language;
    if (saved && saved in translations) {
      setLanguage(saved);
    }

    // Optional: Listen for storage changes to sync across tabs/components if needed
    // But for now, simple hydration fix is priority.
  }, []);

  const t = (key: keyof typeof translations.pt): string => {
    // If not hydrated yet, use 'en' to match server
    // After hydration (isClient=true), 'language' state will hold the localStorage value
    return translations[language][key] || translations.pt[key] || key;
  };

  return { t, language };
}