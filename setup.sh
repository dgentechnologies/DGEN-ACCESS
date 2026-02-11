#!/bin/bash

# DGEN Access Control System - Setup Script
# This script helps you set up the project for the first time

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   DGEN Access Control System - Setup Wizard          ║"
echo "║   Version 2.0 - React + Node.js + Firebase           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detected: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm detected: $NPM_VERSION"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Setup backend .env
if [ ! -f .env ]; then
    echo "⚙️  Setting up backend environment variables..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your Firebase credentials"
else
    echo "✅ Backend .env already exists"
fi
cd ..
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Setup frontend .env
if [ ! -f .env ]; then
    echo "⚙️  Setting up frontend environment variables..."
    cp .env.example .env
    echo "⚠️  Please edit frontend/.env with your Firebase credentials"
else
    echo "✅ Frontend .env already exists"
fi
cd ..
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo "✅ Root dependencies installed"
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Setup Complete!                                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure Firebase:"
echo "   - Create a Firebase project at https://firebase.google.com"
echo "   - Enable Firestore Database"
echo "   - Enable Realtime Database"
echo "   - Get your credentials"
echo ""
echo "2. Update environment files:"
echo "   - Edit backend/.env with Firebase Admin SDK credentials"
echo "   - Edit frontend/.env with Firebase Web SDK credentials"
echo ""
echo "3. Deploy Firebase rules:"
echo "   firebase deploy --only firestore:rules,database"
echo ""
echo "4. Start the application:"
echo "   - Backend:  cd backend && npm start"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Or both:  npm run dev (from root)"
echo ""
echo "5. Access the dashboard:"
echo "   - Open http://localhost:3000 in your browser"
echo ""
echo "📖 For detailed instructions, see README_v2.md"
echo ""
