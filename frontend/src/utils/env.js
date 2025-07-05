// Environment variables configuration
// Vite automatically replaces import.meta.env.VITE_* with actual values during build

export const config = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Digital Signature App',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Environment
  NODE_ENV: import.meta.env.MODE,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// Helper function to get API URL
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.API_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
  return `${baseUrl}/${cleanEndpoint}`;
};

// Helper function to check if debug mode is enabled
export const isDebugMode = () => {
  return config.ENABLE_DEBUG && config.IS_DEVELOPMENT;
};

export default config; 