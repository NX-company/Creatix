import type { Metadata, Viewport } from 'next'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import UserActivityTracker from '@/components/UserActivityTracker'

export const metadata: Metadata = {
  title: 'Creatix - AI Document Generation',
  description: 'Создавайте профессиональные документы за минуты с помощью искусственного интеллекта',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#8B5CF6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <SessionProvider>
          <UserActivityTracker />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}


