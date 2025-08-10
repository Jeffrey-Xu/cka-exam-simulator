'use client'

import { useAuthStore } from '@/lib/store'
import { redirect } from 'next/navigation'
import SimplePractice from '@/components/SimplePractice'

export default function PracticePage() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    redirect('/')
  }

  return <SimplePractice />
}