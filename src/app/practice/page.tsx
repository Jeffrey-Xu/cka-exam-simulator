'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { generateId } from '@/lib/utils'
import Terminal from '@/components/terminal/Terminal'

export default function PracticePage() {
  const { isAuthenticated, user } = useAuthStore()
  const [sessionId] = useState(() => generateId())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      window.location.href = '/'
      return
    }
    
    setIsLoading(false)
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading practice environment...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 text-sm font-medium">Active</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={() => window.location.href = '/'}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Left Panel - Instructions */}
        <div className="w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Practice Environment
              </h2>
              <p className="text-gray-600 mb-4">
                You now have access to a real Kubernetes cluster running on AWS. 
                Use the terminal to practice kubectl commands and explore the cluster.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">Cluster Information</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Master: 100.27.28.215</li>
                <li>• Worker: 54.145.132.72</li>
                <li>• Version: v1.28.15</li>
                <li>• Runtime: containerd</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Try These Commands</h3>
              <div className="space-y-2">
                {[
                  'kubectl get nodes',
                  'kubectl get pods -A',
                  'kubectl get services',
                  'kubectl cluster-info',
                  'kubectl get namespaces',
                  'kubectl create namespace test',
                  'kubectl run nginx --image=nginx',
                  'kubectl get pods'
                ].map((cmd, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded font-mono text-sm">
                    {cmd}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-900 mb-2">💡 Tips</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• All kubectl commands work in real-time</li>
                <li>• Changes persist during your session</li>
                <li>• Use Tab for command completion</li>
                <li>• Ctrl+C to cancel running commands</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">CKA Practice Areas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Storage (20%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Services & Networking (20%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Workloads & Scheduling (15%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Troubleshooting (30%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Cluster Management (15%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Terminal */}
        <div className="flex-1 flex flex-col">
          <Terminal 
            sessionId={sessionId}
            className="flex-1"
            onCommand={(command) => {
              console.log('Command executed:', command)
            }}
          />
        </div>
      </div>
    </div>
  )
}