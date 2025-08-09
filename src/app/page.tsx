'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { generateId } from '@/lib/utils'

export default function HomePage() {
  const { user, isAuthenticated, login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    setIsLoading(true)
    
    // Simulate demo login
    const demoUser = {
      id: generateId(),
      email: 'demo@cka-simulator.com',
      name: 'Demo User',
      avatar: undefined,
      createdAt: new Date(),
      lastLogin: new Date()
    }
    
    login(demoUser)
    setIsLoading(false)
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              CKA Exam Simulator v2.0
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional Kubernetes Administrator certification practice with real AWS cluster access
            </p>
            <div className="mt-6 flex justify-center items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">Cluster Ready</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-blue-800 font-medium">Terminal Active</span>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-gray-600 mb-6">
              Ready to practice your Kubernetes skills? Choose your training mode below.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Practice Mode */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-transparent hover:border-blue-500 transition-colors">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Practice Mode</h3>
                <p className="text-gray-600 mb-6">
                  Individual questions with unlimited time, full hints, and detailed explanations. 
                  Perfect for learning and skill building.
                </p>
                <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                  <li>• Unlimited time per question</li>
                  <li>• Progressive hint system</li>
                  <li>• Detailed explanations</li>
                  <li>• Real kubectl commands</li>
                  <li>• Progress tracking</li>
                </ul>
                <Link 
                  href="/practice"
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Practice
                </Link>
              </div>
            </div>

            {/* Exam Mode */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-transparent hover:border-orange-500 transition-colors">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏱️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mock Exam</h3>
                <p className="text-gray-600 mb-6">
                  Full CKA simulation with 16 questions and 3-hour time limit. 
                  Experience the real exam conditions.
                </p>
                <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                  <li>• 16 comprehensive questions</li>
                  <li>• 3-hour time limit</li>
                  <li>• Limited hints available</li>
                  <li>• Real exam scoring</li>
                  <li>• Performance analytics</li>
                </ul>
                <Link 
                  href="/exam"
                  className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Take Mock Exam
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What Makes This Special
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">🚀</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Real AWS Cluster</h4>
                <p className="text-gray-600 text-sm">
                  Practice on actual Kubernetes infrastructure, not simulations
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">💻</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Interactive Terminal</h4>
                <p className="text-gray-600 text-sm">
                  Full-featured web terminal with real kubectl command execution
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">📊</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Progress Tracking</h4>
                <p className="text-gray-600 text-sm">
                  Detailed analytics and performance insights to improve your skills
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p>CKA Simulator v2.0 - Built for serious Kubernetes practitioners</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              CKA Simulator v2.0
            </h1>
            <p className="text-gray-600">
              Professional Kubernetes certification practice
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Demo Login'}
            </button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Demo login provides full access to:</p>
              <ul className="mt-2 space-y-1">
                <li>• Real AWS Kubernetes cluster</li>
                <li>• Interactive terminal with kubectl</li>
                <li>• 16 comprehensive CKA questions</li>
                <li>• Progress tracking and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}