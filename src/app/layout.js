import './globals.css'
import { Toaster } from 'react-hot-toast'

// Favicon path: Place favicon.ico in src/app/ directory
// Next.js will automatically serve it from the app directory
export const metadata = {
  title: 'DGEN Access Control System',
  description: 'Professional Access Control System with ESP32 Integration',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
