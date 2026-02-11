#!/bin/bash

# Quick Start Script for RFE Foam Pro Local Development
# This script helps you set up and run the application locally

set -e

echo "=================================="
echo "RFE Foam Pro - Quick Start Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "📝 Creating .env.local from template..."
    
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local file"
        echo ""
        echo "⚠️  IMPORTANT: You need to add your Gemini API key!"
        echo "1. Get your API key from: https://aistudio.google.com/app/apikey"
        echo "2. Open .env.local and replace the placeholder with your actual key"
        echo ""
        read -p "Press Enter after you've set up your API key (or Ctrl+C to exit)..."
    else
        echo "❌ .env.local.example not found!"
        exit 1
    fi
else
    # Check if API key is set
    if grep -q "GEMINI_API_KEY=[[:space:]]*$" .env.local || grep -q "GEMINI_API_KEY=your_gemini_api_key_here" .env.local; then
        echo "⚠️  Warning: GEMINI_API_KEY appears to be empty or placeholder in .env.local"
        echo "Please set your actual API key from: https://aistudio.google.com/app/apikey"
        echo ""
        read -p "Press Enter to continue anyway, or Ctrl+C to exit and fix this first..."
    else
        echo "✅ .env.local configured"
    fi
fi

echo ""
echo "🚀 Starting development server..."
echo ""
echo "The app will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "=================================="
echo ""

# Start the development server
npm run dev
