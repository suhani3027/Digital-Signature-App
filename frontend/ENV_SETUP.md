# Environment Variables Setup

This document explains how to configure environment variables for the Digital Signature App frontend.

## How Vite Environment Variables Work

Vite automatically replaces `import.meta.env.VITE_SOMETHING` in your code with actual values from your `.env` file during the build process. This happens both locally and on deployment platforms like Vercel when environment variables are properly set.

## Environment Variables

### Required Variables

- `VITE_API_URL`: The backend API URL (default: `http://localhost:5000`)

### Optional Variables

- `VITE_APP_NAME`: Application name (default: `Digital Signature App`)
- `VITE_APP_VERSION`: Application version (default: `1.0.0`)
- `VITE_ENABLE_DEBUG`: Enable debug mode (default: `true`)
- `VITE_ENABLE_ANALYTICS`: Enable analytics (default: `false`)

## Setup Instructions

### 1. Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` as needed:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_APP_NAME=Digital Signature App
   VITE_APP_VERSION=1.0.0
   VITE_ENABLE_DEBUG=true
   VITE_ENABLE_ANALYTICS=false
   ```

### 2. Production Deployment

For production deployments (Vercel, Netlify, etc.), set the environment variables in your deployment platform's dashboard:

- `VITE_API_URL`: Your production backend URL
- `VITE_APP_NAME`: Your app name
- `VITE_APP_VERSION`: Your app version
- `VITE_ENABLE_DEBUG`: Set to `false` for production
- `VITE_ENABLE_ANALYTICS`: Set to `true` if you want analytics

### 3. Using Environment Variables in Code

```javascript
// Direct access
const apiUrl = import.meta.env.VITE_API_URL;

// Using the utility functions
import { getApiUrl, config, isDebugMode } from '../utils/env.js';

const apiUrl = getApiUrl('api/documents');
const appName = config.APP_NAME;
const debugMode = isDebugMode();
```

## Important Notes

1. **VITE_ Prefix**: Only variables prefixed with `VITE_` are exposed to the client-side code
2. **Build Time**: Environment variables are replaced at build time, not runtime
3. **Security**: Never expose sensitive information (API keys, secrets) in client-side environment variables
4. **Restart Required**: After changing `.env` file, restart your development server

## Example Configurations

### Development
```env
VITE_API_URL=http://localhost:5000
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

### Production
```env
VITE_API_URL=https://your-backend-api.com
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### Staging
```env
VITE_API_URL=https://staging-api.your-domain.com
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
``` 