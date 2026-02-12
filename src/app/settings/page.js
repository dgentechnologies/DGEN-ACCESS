'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ServerIcon,
  CpuChipIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';
import toast from 'react-hot-toast';

export default function Settings() {
  const apiUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  // Theme state
  const [theme, setTheme] = useState('dark');
  
  // Employee ID pattern state
  const [idPattern, setIdPattern] = useState('DGEN-{DEPT}-{SERIAL}');
  const [isEditingPattern, setIsEditingPattern] = useState(false);
  const [tempPattern, setTempPattern] = useState('DGEN-{DEPT}-{SERIAL}');

  // Load settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load theme
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      applyTheme(savedTheme);
      
      // Load ID pattern
      const savedPattern = localStorage.getItem('idPattern') || 'DGEN-{DEPT}-{SERIAL}';
      setIdPattern(savedPattern);
      setTempPattern(savedPattern);
    }
  }, []);

  const applyTheme = (newTheme) => {
    if (typeof window !== 'undefined') {
      if (newTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    toast.success(`Switched to ${newTheme} theme`);
  };

  const handleSavePattern = () => {
    // Validate pattern
    if (!tempPattern.includes('{DEPT}') || !tempPattern.includes('{SERIAL}')) {
      toast.error('Pattern must include {DEPT} and {SERIAL} placeholders');
      return;
    }
    
    setIdPattern(tempPattern);
    localStorage.setItem('idPattern', tempPattern);
    setIsEditingPattern(false);
    toast.success('Employee ID pattern updated successfully');
  };

  const handleCancelEdit = () => {
    setTempPattern(idPattern);
    setIsEditingPattern(false);
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">System configuration and preferences</p>
        </div>

        {/* Theme Settings */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <SwatchIcon className="w-6 h-6 text-purple-500 mr-3" />
              <h2 className="text-xl font-semibold text-white">Appearance</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-4 bg-gray-800 rounded-lg">
              <div className="flex items-center">
                {theme === 'dark' ? (
                  <MoonIcon className="w-5 h-5 text-purple-400 mr-3" />
                ) : (
                  <SunIcon className="w-5 h-5 text-yellow-400 mr-3" />
                )}
                <div>
                  <span className="text-white font-medium">Theme</span>
                  <p className="text-sm text-gray-400">
                    Currently using {theme === 'dark' ? 'Dark' : 'Light'} theme
                  </p>
                </div>
              </div>
              <button
                onClick={handleThemeToggle}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-purple-600' : 'bg-yellow-400'
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
                    theme === 'dark' ? 'translate-x-1' : 'translate-x-11'
                  }`}
                >
                  {theme === 'dark' ? (
                    <MoonIcon className="w-5 h-5 text-purple-600 m-1.5" />
                  ) : (
                    <SunIcon className="w-5 h-5 text-yellow-500 m-1.5" />
                  )}
                </span>
              </button>
            </div>
            <p className="text-xs text-gray-500 italic">
              Note: Theme preference is saved locally in your browser
            </p>
          </div>
        </div>

        {/* Employee ID Pattern Settings */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">Employee ID Configuration</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  ID Pattern Format
                </label>
                {!isEditingPattern ? (
                  <button
                    onClick={() => setIsEditingPattern(true)}
                    className="flex items-center px-3 py-1.5 text-sm bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 mr-1.5" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePattern}
                      className="flex items-center px-3 py-1.5 text-sm bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <CheckIcon className="w-4 h-4 mr-1.5" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {isEditingPattern ? (
                <input
                  type="text"
                  value={tempPattern}
                  onChange={(e) => setTempPattern(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="DGEN-{DEPT}-{SERIAL}"
                />
              ) : (
                <div className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg">
                  <code className="text-purple-400 font-mono">{idPattern}</code>
                </div>
              )}
              
              <div className="mt-3 space-y-2 text-sm text-gray-400">
                <p><strong className="text-gray-300">Available placeholders:</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><code className="text-purple-400">{'{DEPT}'}</code> - Department code (e.g., ADM, EX, EN)</li>
                  <li><code className="text-purple-400">{'{SERIAL}'}</code> - Sequential number (e.g., 00, 01, 02)</li>
                </ul>
                <p className="mt-2"><strong className="text-gray-300">Examples:</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><code className="text-purple-400">DGEN-{'{DEPT}'}-{'{SERIAL}'}</code> → DGEN-ADM-00</li>
                  <li><code className="text-purple-400">EMP-{'{SERIAL}'}-{'{DEPT}'}</code> → EMP-00-ADM</li>
                  <li><code className="text-purple-400">COMPANY-{'{DEPT}'}{'{SERIAL}'}</code> → COMPANY-ADM00</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> Changes to the ID pattern will only apply to newly created employees. 
                Existing employee IDs will not be modified.
              </p>
            </div>
          </div>
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
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Auth Domain</span>
              <span className="text-white font-mono text-sm">
                {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not configured'}
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
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">ESP32 Endpoint</span>
              <span className="text-white font-mono text-sm">{apiUrl}/verify</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Production Endpoint</span>
              <span className="text-purple-400 font-mono text-sm">https://dgen-access-control.vercel.app/verify</span>
            </div>
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
            <p>3. Deploy Firestore rules using: <code className="bg-white/10 px-2 py-1 rounded">firebase deploy --only firestore:rules</code></p>
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
