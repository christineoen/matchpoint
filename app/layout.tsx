import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tennis Match Maker',
  description: 'Social tennis match-making application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
