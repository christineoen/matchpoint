'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import { Suspense } from 'react'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide header on event detail pages
  const isEventPage = pathname?.startsWith('/events/')
  
  if (isEventPage) {
    return null
  }
  
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
      <Header />
    </Suspense>
  )
}
