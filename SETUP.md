# Local Development Setup Guide

This guide will help you set up the RFE Foam Pro application for local development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
  
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

## Initial Setup

### 1. Clone the Repository

If you haven't already, clone this repository:

```bash
git clone https://github.com/spservicesgroupinc-blip/RFED.git
cd RFED
```

### 2. Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install:
- React 19.2.3
- Vite 6.2.0 (build tool)
- TypeScript 5.8.2
- Additional dependencies (lucide-react, jspdf, etc.)

### 3. Configure Environment Variables

The application requires a Gemini API key to function properly.

#### Get Your API Key

1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key or use an existing one

#### Set Up Environment File

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Replace the placeholder with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSy... (your actual key)
   ```

**Important:** Never commit the `.env.local` file to version control. It's already included in `.gitignore`.

## Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at:
- **Local:** http://localhost:3000
- **Network:** http://[your-ip]:3000 (accessible from other devices on your network)

The development server features:
- Hot Module Replacement (HMR) - changes reflect instantly
- Detailed error messages
- Source maps for debugging

### Production Build

To create an optimized production build:

```bash
npm run build
```

This creates a `dist/` folder with optimized assets.

### Preview Production Build

To test the production build locally:

```bash
npm run preview
```

## Application Features

This is a Progressive Web App (PWA) with:
- Service Worker for offline functionality
- Mobile-responsive design
- Desktop keyboard shortcuts
- Estimation and rig management tools

## Project Structure

```
RFED/
├── backend/          # Google Apps Script files (not used in local dev)
├── components/       # React components
├── context/          # React context providers
├── hooks/           # Custom React hooks
├── services/        # Service layer code
├── utils/           # Utility functions
├── App.tsx          # Main application component
├── index.tsx        # Application entry point
├── index.html       # HTML template
├── vite.config.ts   # Vite configuration
└── tsconfig.json    # TypeScript configuration
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Vite will automatically try the next available port (3001, 3002, etc.). Check the terminal output for the actual URL.

### Missing API Key Error

If you see errors related to the API key:
1. Ensure `.env.local` exists in the root directory
2. Verify `GEMINI_API_KEY` is set in `.env.local`
3. Make sure there are no extra spaces or quotes around the key
4. Restart the development server after changing `.env.local`

### Module Not Found Errors

If you encounter module resolution errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

The project uses TypeScript 5.8.2. If you see type errors:
1. Ensure your IDE is using the workspace TypeScript version
2. Try restarting your IDE's TypeScript server
3. Check `tsconfig.json` for configuration

### Build Errors

If the build fails:
1. Check that all dependencies are installed: `npm install`
2. Clear the Vite cache: `rm -rf node_modules/.vite`
3. Try building again: `npm run build`

## Development Workflow

1. **Make changes** to the code
2. **See changes instantly** in your browser (HMR)
3. **Test locally** at http://localhost:3000
4. **Build for production** with `npm run build`
5. **Preview production build** with `npm run preview`

## Additional Resources

- Vite Documentation: https://vitejs.dev/
- React Documentation: https://react.dev/
- TypeScript Documentation: https://www.typescriptlang.org/
- Gemini API Documentation: https://ai.google.dev/

## Getting Help

If you encounter issues not covered in this guide:
1. Check the [GitHub Issues](https://github.com/spservicesgroupinc-blip/RFED/issues)
2. Review the application logs in the browser console
3. Check the terminal output for error messages
