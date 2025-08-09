'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface XTermComponentProps {
  sessionId: string
  onCommand?: (command: string) => void
}

export default function XTermComponent({ sessionId, onCommand }: XTermComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const currentCommandRef = useRef<string>('')

  useEffect(() => {
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

    // Connect to WebSocket
    connectWebSocket(terminal)

    // Handle input
    terminal.onData((data) => {
      handleInput(terminal, data)
    })

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (wsRef.current) {
        wsRef.current.close()
      }
      terminal.dispose()
    }
  }, [sessionId])

  const connectWebSocket = (terminal: XTerm) => {
    // Use WSS (secure WebSocket) to connect to HTTPS server
    const wsUrl = 'wss://34.201.132.19:3001'
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to SSH proxy (WSS)')
        setConnectionStatus('connected')
        showWelcomeMessage(terminal)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(terminal, message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setConnectionStatus('disconnected')
        terminal.writeln('\r\n\x1b[31m[Connection lost - attempting to reconnect...]\x1b[0m')
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (xtermRef.current) {
            connectWebSocket(xtermRef.current)
          }
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        terminal.writeln('\r\n\x1b[33m[SSL Certificate Warning: Click "Advanced" → "Proceed to 34.201.132.19"]\x1b[0m')
        terminal.writeln('\x1b[33m[Then refresh this page to connect]\x1b[0m')
        terminal.writeln('\x1b[31m[Connection error - check network connection]\x1b[0m')
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
      terminal.writeln('\x1b[31m[Failed to connect to SSH proxy server]\x1b[0m')
      terminal.writeln('\x1b[33m[Visit https://34.201.132.19:3001/health to accept SSL certificate]\x1b[0m')
    }
  }

  const handleWebSocketMessage = (terminal: XTerm, message: any) => {
    switch (message.type) {
      case 'system':
        terminal.writeln(`\x1b[36m[${message.data}]\x1b[0m`)
        break
      case 'output':
        if (message.data) {
          const lines = message.data.split('\n')
          lines.forEach((line: string) => {
            terminal.writeln(line)
          })
        }
        break
      case 'error':
        terminal.writeln(`\x1b[31m${message.data}\x1b[0m`)
        break
      case 'command-complete':
        terminal.write('\x1b[36mubuntu@master01\x1b[0m:\x1b[34m~\x1b[0m$ ')
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  const showWelcomeMessage = (terminal: XTerm) => {
    terminal.writeln('\x1b[32m╭─────────────────────────────────────────────────────────────╮\x1b[0m')
    terminal.writeln('\x1b[32m│                 CKA Exam Simulator v2.0                    │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  🚀 Connected to Real Kubernetes Cluster                   │\x1b[0m')
    terminal.writeln('\x1b[32m│  🔐 Secure WebSocket (WSS) via SSH proxy                   │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Master: 100.27.28.215 | Worker: 54.145.132.72            │\x1b[0m')
    terminal.writeln('\x1b[32m│  Proxy: 34.201.132.19:3001 (HTTPS/WSS)                    │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Type kubectl commands to interact with the cluster       │\x1b[0m')
    terminal.writeln('\x1b[32m│  Example: kubectl get nodes                                │\x1b[0m')
    terminal.writeln('\x1b[32m╰─────────────────────────────────────────────────────────────╯\x1b[0m')
    terminal.writeln('')
    terminal.write('\x1b[36mubuntu@master01\x1b[0m:\x1b[34m~\x1b[0m$ ')
  }

  const handleInput = (terminal: XTerm, data: string) => {
    const code = data.charCodeAt(0)

    if (code === 13) { // Enter key
      terminal.writeln('')
      
      const command = currentCommandRef.current.trim()
      if (command && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        onCommand?.(command)
        
        // Send command to WebSocket server
        wsRef.current.send(JSON.stringify({
          type: 'command',
          command: command,
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }))
      } else if (command) {
        terminal.writeln('\x1b[31mNot connected to SSH proxy server\x1b[0m')
        terminal.writeln('\x1b[33mVisit https://34.201.132.19:3001/health to accept SSL certificate\x1b[0m')
        terminal.write('\x1b[36mubuntu@master01\x1b[0m:\x1b[34m~\x1b[0m$ ')
      } else {
        terminal.write('\x1b[36mubuntu@master01\x1b[0m:\x1b[34m~\x1b[0m$ ')
      }
      
      currentCommandRef.current = ''
    } else if (code === 127) { // Backspace
      if (currentCommandRef.current.length > 0) {
        currentCommandRef.current = currentCommandRef.current.slice(0, -1)
        terminal.write('\b \b')
      }
    } else if (code >= 32 && code <= 126) { // Printable characters
      currentCommandRef.current += data
      terminal.write(data)
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
      case 'connected': return 'Connected (WSS)'
      case 'connecting': return 'Connecting...'
      case 'error': return 'SSL Certificate Required'
      default: return 'Disconnected'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="bg-gray-800 text-white px-4 py-1 text-xs flex items-center justify-between">
        <span>SSH Proxy: 34.201.132.19:3001 (HTTPS/WSS)</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      {/* SSL Certificate Helper */}
      {connectionStatus === 'error' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-xs">
          <p className="font-bold">SSL Certificate Required:</p>
          <p>1. Visit <a href="https://34.201.132.19:3001/health" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">https://34.201.132.19:3001/health</a></p>
          <p>2. Click "Advanced" → "Proceed to 34.201.132.19 (unsafe)"</p>
          <p>3. Refresh this page to connect</p>
        </div>
      )}
      
      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="terminal-body flex-1 bg-gray-900"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}