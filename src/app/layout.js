import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'DGEN Access Control System',
  description: 'Professional Access Control System with ESP32 Integration',
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
