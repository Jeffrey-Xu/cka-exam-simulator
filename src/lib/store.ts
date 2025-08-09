import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  User, 
  ExamSession, 
  Question, 
  Answer, 
  TerminalSession,
  ExamProgress 
} from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

interface ExamState {
  currentSession: ExamSession | null
  questions: Question[]
  currentQuestionIndex: number
  answers: Answer[]
  timeRemaining: number
  isActive: boolean
  isPaused: boolean
  
  // Actions
  startSession: (session: ExamSession) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void
  setCurrentQuestion: (index: number) => void
  addAnswer: (answer: Answer) => void
  updateTimeRemaining: (time: number) => void
  loadQuestions: (questions: Question[]) => void
}

interface TerminalState {
  sessions: Record<string, TerminalSession>
  activeSessionId: string | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  
  // Actions
  createSession: (session: TerminalSession) => void
  setActiveSession: (sessionId: string) => void
  updateSessionStatus: (sessionId: string, status: TerminalSession['status']) => void
  removeSession: (sessionId: string) => void
  setConnectionStatus: (status: TerminalState['connectionStatus']) => void
}

interface ProgressState {
  progress: ExamProgress | null
  sessionHistory: ExamSession[]
  
  // Actions
  updateProgress: (progress: ExamProgress) => void
  addSessionToHistory: (session: ExamSession) => void
  clearHistory: () => void
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        
        login: (user) => set({ user, isAuthenticated: true }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      {
        name: 'cka-auth-storage',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: 'auth-store' }
  )
)

// Exam Store
export const useExamStore = create<ExamState>()(
  devtools(
    (set, get) => ({
      currentSession: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      timeRemaining: 0,
      isActive: false,
      isPaused: false,
      
      startSession: (session) => set({
        currentSession: session,
        questions: session.questions,
        currentQuestionIndex: session.currentQuestionIndex,
        answers: session.answers,
        timeRemaining: session.timeRemaining,
        isActive: true,
        isPaused: false,
      }),
      
      pauseSession: () => set({ isPaused: true }),
      resumeSession: () => set({ isPaused: false }),
      endSession: () => set({
        isActive: false,
        isPaused: false,
        currentSession: null,
      }),
      
      setCurrentQuestion: (index) => {
        const { currentSession } = get()
        if (currentSession) {
          set({
            currentQuestionIndex: index,
            currentSession: { ...currentSession, currentQuestionIndex: index }
          })
        }
      },
      
      addAnswer: (answer) => {
        const { answers, currentSession } = get()
        const newAnswers = [...answers, answer]
        set({
          answers: newAnswers,
          currentSession: currentSession ? { ...currentSession, answers: newAnswers } : null
        })
      },
      
      updateTimeRemaining: (time) => {
        const { currentSession } = get()
        set({
          timeRemaining: time,
          currentSession: currentSession ? { ...currentSession, timeRemaining: time } : null
        })
      },
      
      loadQuestions: (questions) => set({ questions }),
    }),
    { name: 'exam-store' }
  )
)

// Terminal Store
export const useTerminalStore = create<TerminalState>()(
  devtools(
    (set, get) => ({
      sessions: {},
      activeSessionId: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      
      createSession: (session) => {
        const { sessions } = get()
        set({
          sessions: { ...sessions, [session.id]: session },
          activeSessionId: session.id,
        })
      },
      
      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
      
      updateSessionStatus: (sessionId, status) => {
        const { sessions } = get()
        if (sessions[sessionId]) {
          set({
            sessions: {
              ...sessions,
              [sessionId]: { ...sessions[sessionId], status }
            },
            isConnected: status === 'connected',
            connectionStatus: status === 'connected' ? 'connected' : 'disconnected'
          })
        }
      },
      
      removeSession: (sessionId) => {
        const { sessions, activeSessionId } = get()
        const newSessions = { ...sessions }
        delete newSessions[sessionId]
        
        set({
          sessions: newSessions,
          activeSessionId: activeSessionId === sessionId ? null : activeSessionId,
        })
      },
      
      setConnectionStatus: (status) => set({
        connectionStatus: status,
        isConnected: status === 'connected'
      }),
    }),
    { name: 'terminal-store' }
  )
)

// Progress Store
export const useProgressStore = create<ProgressState>()(
  devtools(
    persist(
      (set, get) => ({
        progress: null,
        sessionHistory: [],
        
        updateProgress: (progress) => set({ progress }),
        
        addSessionToHistory: (session) => {
          const { sessionHistory } = get()
          set({
            sessionHistory: [session, ...sessionHistory].slice(0, 50) // Keep last 50 sessions
          })
        },
        
        clearHistory: () => set({ sessionHistory: [] }),
      }),
      {
        name: 'cka-progress-storage',
        partialize: (state) => ({ 
          progress: state.progress, 
          sessionHistory: state.sessionHistory 
        }),
      }
    ),
    { name: 'progress-store' }
  )
)