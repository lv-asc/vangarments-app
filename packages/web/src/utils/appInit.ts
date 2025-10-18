// Application Initialization
// Ensures the app starts properly in development mode

export const initializeApp = async () => {
  try {
    console.log('🚀 App initialized for production-ready development');
  } catch (error) {
    console.warn('Failed to initialize app:', error);
  }
};

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
  // Initialize immediately and also on DOM ready
  initializeApp();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  }
}