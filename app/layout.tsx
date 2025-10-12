import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Creatix',
  description: 'AI-powered document generation platform',
  icons: {
    icon: [
      {
        url: '/creatix-logo.svg',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}


