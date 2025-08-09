'use client'

import React, { useEffect, useRef } from 'react'
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

    // Show welcome message
    showWelcomeMessage(terminal)

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
      terminal.dispose()
    }
  }, [sessionId])

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

  const handleInput = async (terminal: XTerm, data: string) => {
    const code = data.charCodeAt(0)

    if (code === 13) { // Enter key
      terminal.writeln('')
      
      // Get the current line (simple implementation)
      const command = getCurrentCommand()
      if (command.trim()) {
        onCommand?.(command)
        await executeCommand(terminal, command.trim())
      }
      
      terminal.write('\x1b[36mubuntu@master01\x1b[0m:\x1b[34m~\x1b[0m$ ')
    } else if (code === 127) { // Backspace
      terminal.write('\b \b')
    } else if (code >= 32 && code <= 126) { // Printable characters
      terminal.write(data)
    }
  }

  const getCurrentCommand = (): string => {
    // This is a simplified implementation
    // In a real implementation, you'd track the current command being typed
    return 'kubectl get nodes' // Placeholder
  }

  const executeCommand = async (terminal: XTerm, command: string) => {
    if (!command.startsWith('kubectl ')) {
      terminal.writeln(`\x1b[31mOnly kubectl commands are supported\x1b[0m`)
      return
    }

    try {
      terminal.writeln(`\x1b[33mExecuting: ${command}\x1b[0m`)
      
      const response = await fetch('/api/terminal/ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          sessionId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          const lines = result.data.split('\n')
          lines.forEach((line: string) => {
            terminal.writeln(line)
          })
        }
        if (result.error) {
          terminal.writeln(`\x1b[31mError: ${result.error}\x1b[0m`)
        }
      } else {
        terminal.writeln(`\x1b[31mFailed to execute command\x1b[0m`)
      }
    } catch (error) {
      terminal.writeln(`\x1b[31mConnection error: ${error}\x1b[0m`)
    }
  }

  return (
    <div 
      ref={terminalRef} 
      className="terminal-body flex-1 bg-gray-900"
      style={{ minHeight: '400px' }}
    />
  )
}