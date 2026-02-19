'use client';

import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import Head from 'next/head'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <title>DGEN Access Control System</title>
        <meta name="description" content="Professional Access Control System with ESP32 Integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
