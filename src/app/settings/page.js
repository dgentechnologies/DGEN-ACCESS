'use client';

import {
  ShieldCheckIcon,
  ServerIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function Settings() {
  const apiUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">System configuration and information</p>
        </div>

        {/* Firebase Configuration */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <ServerIcon className="w-6 h-6 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">Firebase Configuration</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Project ID</span>
              <span className="text-white font-mono text-sm">
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Auth Domain</span>
              <span className="text-white font-mono text-sm">
                {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Database URL</span>
              <span className="text-white font-mono text-sm">
                {process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'Not configured'}
              </span>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <CpuChipIcon className="w-6 h-6 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">API Configuration</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">API URL</span>
              <span className="text-white font-mono text-sm">{apiUrl}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">ESP32 Endpoint</span>
              <span className="text-white font-mono text-sm">{apiUrl}/verify</span>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong className="text-white">Firestore Rules:</strong> Located in{' '}
              <code className="text-purple-400">.firebase/firestore.rules</code>
            </p>
            <p>
              <strong className="text-white">Realtime DB Rules:</strong> Located in{' '}
              <code className="text-purple-400">.firebase/database.rules.json</code>
            </p>
            <p>
              <strong className="text-white">Environment Variables:</strong> Check{' '}
              <code className="text-purple-400">.env.example</code> in the root directory
            </p>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-semibold">Setup Instructions</h2>
          </div>
          <div className="space-y-2 text-purple-100">
            <p>1. Create a Firebase project at firebase.google.com</p>
            <p>2. Set up environment variables:</p>
            <p className="pl-4">- Copy .env.example to .env.local</p>
            <p className="pl-4">- Add your Firebase Admin credentials</p>
            <p>3. Deploy Firebase rules using: <code className="bg-white/10 px-2 py-1 rounded">firebase deploy --only firestore:rules,database</code></p>
            <p>4. Install dependencies and start the Next.js server:</p>
            <p className="pl-4"><code className="bg-white/10 px-2 py-1 rounded">npm install && npm run dev</code></p>
            <p>5. Build for production:</p>
            <p className="pl-4"><code className="bg-white/10 px-2 py-1 rounded">npm run build</code></p>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
