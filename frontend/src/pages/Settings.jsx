import React from 'react';
import {
  ShieldCheckIcon,
  ServerIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400">System configuration and information</p>
      </div>

      {/* Firebase Configuration */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center mb-4">
          <ServerIcon className="w-6 h-6 text-primary-500 mr-3" />
          <h2 className="text-xl font-semibold text-white">Firebase Configuration</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-dark-700">
            <span className="text-dark-400">Project ID</span>
            <span className="text-white font-mono text-sm">
              {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-dark-700">
            <span className="text-dark-400">Auth Domain</span>
            <span className="text-white font-mono text-sm">
              {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-dark-400">Database URL</span>
            <span className="text-white font-mono text-sm">
              {import.meta.env.VITE_FIREBASE_DATABASE_URL || 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center mb-4">
          <CpuChipIcon className="w-6 h-6 text-primary-500 mr-3" />
          <h2 className="text-xl font-semibold text-white">API Configuration</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-dark-700">
            <span className="text-dark-400">API URL</span>
            <span className="text-white font-mono text-sm">{apiUrl}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-dark-400">ESP32 Endpoint</span>
            <span className="text-white font-mono text-sm">{apiUrl}/verify</span>
          </div>
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="w-6 h-6 text-primary-500 mr-3" />
          <h2 className="text-xl font-semibold text-white">Security</h2>
        </div>
        <div className="space-y-3 text-dark-300">
          <p>
            <strong className="text-white">Firestore Rules:</strong> Located in{' '}
            <code className="text-primary-400">.firebase/firestore.rules</code>
          </p>
          <p>
            <strong className="text-white">Realtime DB Rules:</strong> Located in{' '}
            <code className="text-primary-400">.firebase/database.rules.json</code>
          </p>
          <p>
            <strong className="text-white">Environment Variables:</strong> Check{' '}
            <code className="text-primary-400">backend/.env.example</code> and{' '}
            <code className="text-primary-400">frontend/.env.example</code>
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="w-6 h-6 mr-3" />
          <h2 className="text-xl font-semibold">Setup Instructions</h2>
        </div>
        <div className="space-y-2 text-primary-100">
          <p>1. Create a Firebase project at firebase.google.com</p>
          <p>2. Copy configuration files:</p>
          <p className="pl-4">- backend/.env.example → backend/.env</p>
          <p className="pl-4">- frontend/.env.example → frontend/.env</p>
          <p>3. Add your Firebase credentials to both .env files</p>
          <p>4. Deploy Firebase rules using: <code className="bg-white/10 px-2 py-1 rounded">firebase deploy --only firestore:rules,database</code></p>
          <p>5. Install dependencies and start servers:</p>
          <p className="pl-4">- Backend: <code className="bg-white/10 px-2 py-1 rounded">cd backend && npm install && npm start</code></p>
          <p className="pl-4">- Frontend: <code className="bg-white/10 px-2 py-1 rounded">cd frontend && npm install && npm run dev</code></p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
