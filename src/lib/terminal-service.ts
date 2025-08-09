import type { TerminalMessage, TerminalSession } from '@/types'
import { generateId } from './utils'

export class TerminalService {
  private ws: WebSocket | null = null
  private sessionId: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: TerminalMessage[] = []
  private isConnecting = false

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/terminal/ws`
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('Terminal WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
        
        // Send session initialization
        this.send({
          type: 'terminal-input',
          sessionId: this.sessionId,
          data: JSON.stringify({ action: 'init', sessionId: this.sessionId }),
          timestamp: new Date()
        })

        // Send queued messages
        this.flushMessageQueue()
        
        this.onConnectionChange?.(true)
      }

      this.ws.onmessage = (event) => {
        try {
          const message: TerminalMessage = JSON.parse(event.data)
          this.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('Terminal WebSocket closed:', event.code, event.reason)
        this.isConnecting = false
        this.onConnectionChange?.(false)
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('Terminal WebSocket error:', error)
        this.isConnecting = false
        this.onConnectionChange?.(false)
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.isConnecting = false
      this.onConnectionChange?.(false)
      throw error
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect().catch(console.error)
      }
    }, delay)
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendImmediate(message)
      }
    }
  }

  send(message: TerminalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendImmediate(message)
    } else {
      // Queue message for later
      this.messageQueue.push(message)
      
      // Try to connect if not connected
      if (!this.isConnecting) {
        this.connect().catch(console.error)
      }
    }
  }

  private sendImmediate(message: TerminalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  sendCommand(command: string): void {
    this.send({
      type: 'terminal-input',
      sessionId: this.sessionId,
      data: command,
      timestamp: new Date()
    })
  }

  sendKeyInput(key: string): void {
    this.send({
      type: 'terminal-input',
      sessionId: this.sessionId,
      data: JSON.stringify({ action: 'key', key }),
      timestamp: new Date()
    })
  }

  resize(cols: number, rows: number): void {
    this.send({
      type: 'terminal-input',
      sessionId: this.sessionId,
      data: JSON.stringify({ action: 'resize', cols, rows }),
      timestamp: new Date()
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.messageQueue = []
    this.reconnectAttempts = 0
    this.isConnecting = false
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Event handlers (to be set by consumers)
  onMessage?: (message: TerminalMessage) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: Error) => void
}

// Terminal Manager for handling multiple terminal sessions
export class TerminalManager {
  private terminals: Map<string, TerminalService> = new Map()
  private activeTerminalId: string | null = null

  createTerminal(sessionId: string): TerminalService {
    if (this.terminals.has(sessionId)) {
      return this.terminals.get(sessionId)!
    }

    const terminal = new TerminalService(sessionId)
    this.terminals.set(sessionId, terminal)
    
    if (!this.activeTerminalId) {
      this.activeTerminalId = sessionId
    }

    return terminal
  }

  getTerminal(sessionId: string): TerminalService | null {
    return this.terminals.get(sessionId) || null
  }

  getActiveTerminal(): TerminalService | null {
    return this.activeTerminalId ? this.getTerminal(this.activeTerminalId) : null
  }

  setActiveTerminal(sessionId: string): void {
    if (this.terminals.has(sessionId)) {
      this.activeTerminalId = sessionId
    }
  }

  removeTerminal(sessionId: string): void {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      terminal.disconnect()
      this.terminals.delete(sessionId)
      
      if (this.activeTerminalId === sessionId) {
        this.activeTerminalId = this.terminals.size > 0 
          ? Array.from(this.terminals.keys())[0] 
          : null
      }
    }
  }

  disconnectAll(): void {
    for (const terminal of this.terminals.values()) {
      terminal.disconnect()
    }
    this.terminals.clear()
    this.activeTerminalId = null
  }
}

// Global terminal manager instance
export const terminalManager = new TerminalManager()