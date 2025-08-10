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
  const [sslAccepted, setSslAccepted] = useState(false)
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

    // Auto-accept SSL and connect
    autoAcceptSSLAndConnect(terminal)

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

  const autoAcceptSSLAndConnect = async (terminal: XTerm) => {
    terminal.writeln('\x1b[33m[Initializing secure connection to ssh-proxy.ciscloudlab.link...]\x1b[0m')
    
    try {
      // First, try to auto-accept the SSL certificate by making an HTTPS request
      const response = await fetch('https://ssh-proxy.ciscloudlab.link:3001/health', {
        method: 'GET',
        mode: 'no-cors', // This bypasses CORS but allows the SSL handshake
      }).catch(() => null)

      // Wait a moment for SSL to be accepted
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSslAccepted(true)
      connectWebSocket(terminal)
      
    } catch (error) {
      console.log('Auto SSL acceptance failed, trying direct WebSocket connection')
      connectWebSocket(terminal)
    }
  }

  const connectWebSocket = (terminal: XTerm) => {
    // Use correct DNS name - ciscloudlab.link (not cislab.link)
    const wsUrl = 'wss://ssh-proxy.ciscloudlab.link:3001'
    
    try {
      // Create WebSocket with DNS-based URL
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to SSH proxy via DNS (ciscloudlab.link)')
        setConnectionStatus('connected')
        setSslAccepted(true)
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

      ws.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code)
        setConnectionStatus('disconnected')
        
        if (event.code === 1006 && !sslAccepted) {
          // SSL certificate issue
          terminal.writeln('\r\n\x1b[33m[SSL Certificate Required - Auto-accepting...]\x1b[0m')
          setSslAccepted(false)
          
          // Try to open the health endpoint in a hidden iframe to accept SSL
          tryAutoAcceptSSL(terminal)
        } else {
          terminal.writeln('\r\n\x1b[31m[Connection lost - attempting to reconnect...]\x1b[0m')
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (xtermRef.current) {
              connectWebSocket(xtermRef.current)
            }
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        
        if (!sslAccepted) {
          terminal.writeln('\r\n\x1b[33m[Attempting to accept SSL certificate automatically...]\x1b[0m')
          tryAutoAcceptSSL(terminal)
        } else {
          terminal.writeln('\r\n\x1b[31m[Connection error - check network connection]\x1b[0m')
        }
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
      terminal.writeln('\x1b[31m[Failed to connect to SSH proxy server]\x1b[0m')
      tryAutoAcceptSSL(terminal)
    }
  }

  const tryAutoAcceptSSL = (terminal: XTerm) => {
    terminal.writeln('\x1b[36m[Opening SSL certificate acceptance window...]\x1b[0m')
    
    // Open the health endpoint in a new window to accept SSL certificate
    const sslWindow = window.open(
      'https://ssh-proxy.ciscloudlab.link:3001/health',
      'ssl-accept',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    )
    
    terminal.writeln('\x1b[33m[Please accept the SSL certificate in the popup window]\x1b[0m')
    terminal.writeln('\x1b[33m[Then close the popup and the connection will retry automatically]\x1b[0m')
    
    // Check if the popup was closed and retry connection
    const checkPopup = setInterval(() => {
      if (sslWindow?.closed) {
        clearInterval(checkPopup)
        terminal.writeln('\x1b[36m[SSL window closed - retrying connection...]\x1b[0m')
        setSslAccepted(true)
        
        setTimeout(() => {
          if (xtermRef.current) {
            connectWebSocket(xtermRef.current)
          }
        }, 2000)
      }
    }, 1000)
    
    // Auto-close popup after 30 seconds if user doesn't interact
    setTimeout(() => {
      if (sslWindow && !sslWindow.closed) {
        sslWindow.close()
        clearInterval(checkPopup)
      }
    }, 30000)
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
    terminal.writeln('\x1b[32m│  🔐 Secure WebSocket (WSS) via DNS                         │\x1b[0m')
    terminal.writeln('\x1b[32m│  🌐 AWS-managed DNS (ciscloudlab.link)                     │\x1b[0m')
    terminal.writeln('\x1b[32m│                                                             │\x1b[0m')
    terminal.writeln('\x1b[32m│  Master: master01.ciscloudlab.link                         │\x1b[0m')
    terminal.writeln('\x1b[32m│  Worker: worker01.ciscloudlab.link                         │\x1b[0m')
    terminal.writeln('\x1b[32m│  Proxy:  ssh-proxy.ciscloudlab.link:3001                  │\x1b[0m')
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
        if (!sslAccepted) {
          terminal.writeln('\x1b[33mTrying to establish secure connection...\x1b[0m')
          tryAutoAcceptSSL(terminal)
        }
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
      case 'connected': return 'Connected (DNS/WSS)'
      case 'connecting': return 'Connecting...'
      case 'error': return sslAccepted ? 'Connection Error' : 'SSL Setup Required'
      default: return 'Disconnected'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="bg-gray-800 text-white px-4 py-1 text-xs flex items-center justify-between">
        <span>SSH Proxy: ssh-proxy.ciscloudlab.link:3001 (AWS DNS/WSS)</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      {/* SSL Certificate Helper - Only show if needed */}
      {connectionStatus === 'error' && !sslAccepted && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 text-xs">
          <p className="font-bold">🔐 SSL Certificate Auto-Setup:</p>
          <p>The system will automatically open a popup to accept the SSL certificate.</p>
          <p>This is required once for secure WebSocket communication.</p>
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