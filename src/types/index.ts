// Core Types for CKA Simulator v2

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  lastLogin: Date
}

export interface ExamSession {
  id: string
  userId: string
  mode: 'practice' | 'exam'
  status: 'active' | 'paused' | 'completed' | 'expired'
  startTime: Date
  endTime?: Date
  timeLimit: number // seconds
  timeRemaining: number
  currentQuestionIndex: number
  questions: Question[]
  answers: Answer[]
  score: number
  terminalSessionId: string
  settings: ExamSettings
}

export interface ExamSettings {
  timeLimit: number
  hintsEnabled: boolean
  autoSave: boolean
  shuffleQuestions: boolean
}

export interface Question {
  id: string
  title: string
  description: string
  domain: CKADomain
  difficulty: 'easy' | 'medium' | 'hard'
  timeEstimate: number // minutes
  tasks: Task[]
  hints: Hint[]
  validation: ValidationRule[]
  resources?: Resource[]
}

export interface Task {
  id: string
  description: string
  commands?: string[]
  expectedOutput?: string
  weight: number // percentage of question score
}

export interface Hint {
  level: number
  description: string
  content: string
  penaltyPoints: number
}

export interface ValidationRule {
  type: 'command' | 'resource' | 'output'
  description: string
  command?: string
  expectedResult?: any
  weight: number
}

export interface Resource {
  name: string
  type: 'yaml' | 'json' | 'text'
  content: string
}

export interface Answer {
  questionId: string
  commands: string[]
  output: string[]
  hintsUsed: number[]
  timeSpent: number
  score: number
  isCorrect: boolean
  submittedAt: Date
}

export interface TerminalSession {
  id: string
  sessionId: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  clusterId: string
  nodeType: 'master' | 'worker'
  connectionInfo: {
    host: string
    port: number
    username: string
  }
  lastActivity: Date
}

export interface TerminalMessage {
  type: 'terminal-input' | 'terminal-output' | 'terminal-error' | 'terminal-system' | 'input' | 'output' | 'error' | 'system'
  data: string
  timestamp: Date
  sessionId: string
}

export type CKADomain = 
  | 'Storage'
  | 'Services & Networking'
  | 'Workloads & Scheduling'
  | 'Troubleshooting & Maintenance'
  | 'Cluster Architecture, Installation & Configuration'

export interface ClusterInfo {
  id: string
  name: string
  status: 'active' | 'inactive' | 'maintenance'
  nodes: ClusterNode[]
  version: string
  endpoint: string
}

export interface ClusterNode {
  id: string
  name: string
  type: 'master' | 'worker'
  ip: string
  status: 'ready' | 'not-ready' | 'unknown'
  resources: {
    cpu: string
    memory: string
    storage: string
  }
}

export interface ExamProgress {
  totalQuestions: number
  completedQuestions: number
  correctAnswers: number
  timeSpent: number
  averageScore: number
  domainProgress: Record<CKADomain, {
    total: number
    completed: number
    score: number
  }>
}

export interface WebSocketMessage {
  type: 'terminal-input' | 'terminal-output' | 'terminal-error' | 'session-update' | 'ping' | 'pong'
  sessionId: string
  data: any
  timestamp: Date
}