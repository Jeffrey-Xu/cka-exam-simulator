'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

import { TerminalService } from '@/lib/terminal-service'
import { useTerminalStore } from '@/lib/store'
import type { TerminalMessage } from '@/types'

interface TerminalProps {
  sessionId: string
  className?: string
  onCommand?: (command: string) => void
}

export default function Terminal({ sessionId, className = '', onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const terminalServiceRef = useRef<TerminalService | null>(null)
  
  const [isInitialized, setIsInitialized] = useState(false)
  const { connectionStatus, setConnectionStatus } = useTerminalStore()

  useEffect(() => {
    if (!terminalRef.current || isInitialized) return

    initializeTerminal()
    setIsInitialized(true)

    return () => {
      cleanup()
    }
  }, [sessionId])

  const initializeTerminal = async () => {
    if (!terminalRef.current) return

    // Create xterm instance
    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#3e3e3e',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      cols: 80,
      rows: 24,
      scrollback: 1000,
      tabStopWidth: 4
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    // Open terminal
    terminal.open(terminalRef.current)
    fitAddon.fit()

    // Store references
    xtermRef.current = terminal
    fitAddonRef.current = fitAddon

    // Create terminal service
    const terminalService = new TerminalService(sessionId)
    terminalServiceRef.current = terminalService

    // Set up event handlers
    setupEventHandlers(terminal, terminalService)

    // Show initial message
    showWelcomeMessage(terminal)

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit()
      if (terminalService.isConnected()) {
        terminalService.resize(terminal.cols, terminal.rows)
      }
    }
    window.addEventListener('resize', handleResize)
  }

  const setupEventHandlers = (terminal: XTerm, terminalService: TerminalService) => {
    // Handle terminal input
    terminal.onData((data) => {
      if (terminalService.isConnected()) {
        terminalService.sendKeyInput(data)
      }
    })

    // Handle terminal messages from backend
    terminalService.onMessage = (message: TerminalMessage) => {
      switch (message.type) {
        case 'output':
          terminal.write(message.data)
          break
        case 'error':
          terminal.write(`\x1b[31m${message.data}\x1b[0m`)
          break
        case 'system':
          terminal.write(`\x1b[33m${message.data}\x1b[0m`)
          break
      }
    }

    // Handle connection changes
    terminalService.onConnectionChange = (connected: boolean) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected')
    }

    // Handle errors
    terminalService.onError = (error: Error) => {
      console.error('Terminal service error:', error)
      setConnectionStatus('error')
      terminal.write(`\x1b[31mTerminal Error: ${error.message}\x1b[0m\r\n`)
    }
  }

  const showWelcomeMessage = (terminal: XTerm) => {
    terminal.writeln('\x1b[32m╭─────────────────────────────────────────────────────────────╮\x1b[0m')
    terminal.writeln('\x1b[32m│                 CKA Exam Simulator v2.0                    │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  🚀 Connected to Kubernetes Cluster                        │\x1b[0m')
    terminal.writeln('\x1b[32m│  📡 Real kubectl commands available                        │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Master: 100.27.28.215 | Worker: 54.145.132.72            │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Type kubectl commands to interact with the cluster       │\x1b[0m')
    terminal.writeln('\x1b[32m│  Example: kubectl get nodes                                │\x1b[0m')
    terminal.writeln('\x1b[32m╰─────────────────────────────────────────────────────────────╯\x1b[0m')
    terminal.writeln('')
    terminal.write('\x1b[36mubuntu@master01\x1b[0m:\x1b[34m~\x1b[0m$ ')
  }

  const cleanup = () => {
    if (terminalServiceRef.current) {
      terminalServiceRef.current.disconnect()
      terminalServiceRef.current = null
    }
    
    if (xtermRef.current) {
      xtermRef.current.dispose()
      xtermRef.current = null
    }
  }

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
      <div 
        ref={terminalRef} 
        className="terminal-body flex-1 bg-gray-900"
        style={{ minHeight: '400px' }}
      />

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