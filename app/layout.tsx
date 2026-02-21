import type { Metadata } from 'next'
import './globals.css'
import ConditionalHeader from './components/ConditionalHeader'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <ConditionalHeader />
        {children}
      </body>
    </html>
  )
}
