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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const maxReconnectAttempts = 10

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

    // Connect directly - no SSL auto-acceptance needed with Let's Encrypt
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
      
      // Clear timeouts and intervals
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
      
      terminal.dispose()
    }
  }, [sessionId])

  const connectWebSocket = (terminal: XTerm) => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Don't attempt to connect if we already have an active connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus('connecting')
    terminal.writeln('\x1b[33m[Connecting to ssh-proxy.ciscloudlab.link with trusted SSL...]\x1b[0m')
    
    // Use DNS name with trusted Let's Encrypt certificate
    const wsUrl = 'wss://ssh-proxy.ciscloudlab.link:3001'
    
    try {
      // Create WebSocket with trusted SSL
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to SSH proxy via trusted SSL')
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0 // Reset reconnect attempts on successful connection
        
        // Send session initialization with keepalive
        ws.send(JSON.stringify({
          type: 'init',
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          keepAlive: true
        }))
        
        showWelcomeMessage(terminal)
        startHeartbeat()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(terminal, message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason)
        setConnectionStatus('disconnected')
        stopHeartbeat()
        
        // Only show reconnection message if it wasn't a clean close
        if (event.code !== 1000) {
          terminal.writeln('\r\n\x1b[31m[Connection lost - attempting to reconnect...]\x1b[0m')
          scheduleReconnect(terminal)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        stopHeartbeat()
        terminal.writeln('\r\n\x1b[31m[Connection error - retrying...]\x1b[0m')
        scheduleReconnect(terminal)
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
      terminal.writeln('\x1b[31m[Failed to connect to SSH proxy server]\x1b[0m')
      scheduleReconnect(terminal)
    }
  }

  const scheduleReconnect = (terminal: XTerm) => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      terminal.writeln('\x1b[31m[Max reconnection attempts reached. Please refresh the page.]\x1b[0m')
      setConnectionStatus('error')
      return
    }

    reconnectAttemptsRef.current++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000) // Exponential backoff, max 30s
    
    terminal.writeln(`\x1b[33m[Reconnecting in ${delay/1000}s... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})]\x1b[0m`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (xtermRef.current) {
        connectWebSocket(xtermRef.current)
      }
    }, delay)
  }

  const startHeartbeat = () => {
    stopHeartbeat() // Clear any existing heartbeat
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }))
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
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
      case 'pong':
        // Heartbeat response - connection is alive
        console.log('Received heartbeat pong from server')
        break
      case 'session-restored':
        terminal.writeln(`\x1b[32m[Session restored: ${message.sessionId}]\x1b[0m`)
        break
      default:
        console.log('Unknown message type:', message.type, message)
    }
  }

  const showWelcomeMessage = (terminal: XTerm) => {
    terminal.writeln('\x1b[32m╭─────────────────────────────────────────────────────────────╮\x1b[0m')
    terminal.writeln('\x1b[32m│                 CKA Exam Simulator v3.0                    │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  🚀 Connected to Real Kubernetes Cluster                   │\x1b[0m')
    terminal.writeln('\x1b[32m│  🔐 Trusted SSL Certificate (Let\'s Encrypt)                │\x1b[0m')
    terminal.writeln('\x1b[32m│  🌐 AWS-managed DNS (ciscloudlab.link)                     │\x1b[0m')
    terminal.writeln('\x1b[32m│  💻 Full Command Access (All Linux Commands)               │\x1b[0m')
    terminal.writeln('\x1b[32m│  ❤️  Session Persistence & Auto-Reconnection               │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Master: master01.ciscloudlab.link                         │\x1b[0m')
    terminal.writeln('\x1b[32m│  Worker: worker01.ciscloudlab.link                         │\x1b[0m')
    terminal.writeln('\x1b[32m│  Proxy:  ssh-proxy.ciscloudlab.link:3001                  │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Try any command: ls, pwd, kubectl get nodes, ps aux      │\x1b[0m')
    terminal.writeln('\x1b[32m│  Full Linux server experience with real Kubernetes!       │\x1b[0m')
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
        
        // Send command to WebSocket server with session persistence
        wsRef.current.send(JSON.stringify({
          type: 'command',
          command: command,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          keepSession: true
        }))
      } else if (command) {
        terminal.writeln('\x1b[31mNot connected to SSH proxy server - attempting to reconnect...\x1b[0m')
        if (xtermRef.current) {
          connectWebSocket(xtermRef.current)
        }
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
      case 'connected': return 'Connected (Persistent Session)'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="bg-gray-800 text-white px-4 py-1 text-xs flex items-center justify-between">
        <span>SSH Proxy: ssh-proxy.ciscloudlab.link:3001 (Let's Encrypt SSL)</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="terminal-body flex-1 bg-gray-900"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}