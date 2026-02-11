<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RKGUbXEdWmRToAl8xMss-I8boI8BDych

## Run Locally

**Prerequisites:**  
- Node.js (version 18 or higher recommended)
- npm (comes with Node.js)

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Key:**
   - Copy the example environment file:
     ```bash
     cp .env.local.example .env.local
     ```
   - Get your Gemini API key from: https://aistudio.google.com/app/apikey
   - Open `.env.local` and set your API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at: http://localhost:3000

### Available Scripts

- `npm run dev` - Start the development server (with hot reload)
- `npm run build` - Build the production-ready app
- `npm run preview` - Preview the production build locally

### Troubleshooting

- If port 3000 is already in use, the server will automatically try the next available port
- Make sure you have set the `GEMINI_API_KEY` in `.env.local` before running the app
- If you encounter any issues, try deleting `node_modules` and running `npm install` again
