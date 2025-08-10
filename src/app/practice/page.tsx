'use client'

import { useAuthStore } from '@/lib/store'
import { redirect } from 'next/navigation'
import ExamPractice from '@/components/ExamPractice'

export default function PracticePage() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    redirect('/')
  }

  return <ExamPractice />
}