import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guitar Guide - Learn Guitar with AR',
  description: 'Real-time guitar chord coaching with computer vision',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
