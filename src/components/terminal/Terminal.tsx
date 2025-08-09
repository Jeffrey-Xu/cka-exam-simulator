'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTerminalStore } from '@/lib/store'
import type { TerminalMessage } from '@/types'

// Dynamically import xterm to avoid SSR issues
const XTermComponent = dynamic(() => import('./XTermComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading terminal...</p>
      </div>
    </div>
  )
})

interface TerminalProps {
  sessionId: string
  className?: string
  onCommand?: (command: string) => void
}

export default function Terminal({ sessionId, className = '', onCommand }: TerminalProps) {
  const { connectionStatus, setConnectionStatus } = useTerminalStore()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Error'
      default: return 'Ready'
    }
  }

  if (!isClient) {
    return (
      <div className={`terminal-container flex flex-col h-full ${className}`}>
        <div className="terminal-header bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium">Terminal - Loading...</span>
          </div>
        </div>
        <div className="flex-1 bg-gray-900 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Initializing terminal...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`terminal-container flex flex-col h-full ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm font-medium">Terminal - ubuntu@master01</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs">{getStatusText()}</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1">
        <XTermComponent 
          sessionId={sessionId}
          onCommand={onCommand}
        />
      </div>

      {/* Terminal Footer */}
      <div className="terminal-footer bg-gray-800 text-gray-400 px-4 py-1 text-xs border-t">
        <div className="flex justify-between items-center">
          <span>Session: {sessionId}</span>
          <span>CKA Simulator v2.0</span>
          <span>Cluster: AWS K8s</span>
        </div>
      </div>
    </div>
  )
}