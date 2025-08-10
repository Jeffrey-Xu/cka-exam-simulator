'use client'

import dynamic from 'next/dynamic'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Dynamic imports to avoid SSR issues
const XTermComponent = dynamic(() => import('@/components/terminal/XTermComponent'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading terminal...</div></div>
})

const QuestionManager = dynamic(() => import('@/components/exam/QuestionManager'), {
  ssr: false
})

const HintSystem = dynamic(() => import('@/components/exam/HintSystem'), {
  ssr: false
})

const PerformanceDashboard = dynamic(() => import('@/components/analytics/PerformanceDashboard'), {
  ssr: false
})
import { 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Mock data - in real app this would come from API/database
const mockQuestions = [
  {
    id: 'q1-pvc',
    title: 'PersistentVolumeClaim (PVC) with MariaDB',
    domain: 'Storage',
    difficulty: 3,
    timeLimit: 20,
    description: 'Create a PVC and deploy MariaDB with persistent storage',
    hints: [
      {
        id: 'h1',
        level: 'basic' as const,
        title: 'Storage Class Hint',
        content: 'Check available storage classes with: kubectl get storageclass',
        penaltyPoints: 5,
        unlocked: false
      },
      {
        id: 'h2',
        level: 'intermediate' as const,
        title: 'PVC Configuration',
        content: 'PVC needs accessModes: [ReadWriteOnce] and resources.requests.storage',
        penaltyPoints: 10,
        unlocked: false
      }
    ],
    validation: [
      {
        id: 'v1',
        description: 'PVC is created and bound',
        command: 'kubectl get pvc mariadb-pvc',
        expectedOutput: 'Bound',
        status: 'pending' as const,
        points: 30
      },
      {
        id: 'v2',
        description: 'MariaDB pod is running',
        command: 'kubectl get pod mariadb',
        expectedOutput: 'Running',
        status: 'pending' as const,
        points: 40
      }
    ],
    status: 'not-started' as const,
    attempts: 0
  },
  {
    id: 'q2-service',
    title: 'Service (L4) with NodePort',
    domain: 'Services & Networking',
    difficulty: 2,
    timeLimit: 15,
    description: 'Create a NodePort service for nginx deployment',
    hints: [
      {
        id: 'h3',
        level: 'basic' as const,
        title: 'Service Types',
        content: 'NodePort exposes service on each node at a static port',
        penaltyPoints: 5,
        unlocked: false
      }
    ],
    validation: [
      {
        id: 'v3',
        description: 'Service is created with NodePort type',
        command: 'kubectl get svc nginx-service',
        expectedOutput: 'NodePort',
        status: 'pending' as const,
        points: 50
      }
    ],
    status: 'completed' as const,
    attempts: 2,
    bestTime: 12,
    lastAttempt: new Date('2025-08-09')
  }
]

const mockPerformanceData = {
  overallStats: {
    totalQuestions: 16,
    completedQuestions: 8,
    averageScore: 78,
    totalTimeSpent: 240,
    currentStreak: 5,
    bestStreak: 12,
    examReadiness: 72
  },
  domainPerformance: [
    {
      domain: 'Storage',
      questionsCompleted: 2,
      totalQuestions: 3,
      averageScore: 85,
      averageTime: 18,
      weakAreas: ['StatefulSets', 'Volume Snapshots'],
      trend: 'improving' as const
    },
    {
      domain: 'Services & Networking',
      questionsCompleted: 3,
      totalQuestions: 5,
      averageScore: 72,
      averageTime: 15,
      weakAreas: ['Network Policies', 'Ingress'],
      trend: 'stable' as const
    },
    {
      domain: 'Troubleshooting',
      questionsCompleted: 1,
      totalQuestions: 4,
      averageScore: 65,
      averageTime: 25,
      weakAreas: ['Log Analysis', 'Resource Issues'],
      trend: 'declining' as const
    }
  ],
  recentActivity: [
    {
      date: new Date('2025-08-09'),
      questionId: 'q2-service',
      questionTitle: 'Service (L4) with NodePort',
      domain: 'Services & Networking',
      score: 85,
      timeSpent: 720,
      hintsUsed: 1
    },
    {
      date: new Date('2025-08-08'),
      questionId: 'q1-pvc',
      questionTitle: 'PersistentVolumeClaim (PVC)',
      domain: 'Storage',
      score: 92,
      timeSpent: 1080,
      hintsUsed: 0
    }
  ],
  studyRecommendations: [
    {
      priority: 'high' as const,
      domain: 'Troubleshooting',
      reason: 'This domain has the highest exam weight (30%) but your lowest performance',
      suggestedActions: [
        'Practice log analysis with kubectl logs',
        'Study resource troubleshooting scenarios',
        'Review cluster component debugging'
      ]
    },
    {
      priority: 'medium' as const,
      domain: 'Services & Networking',
      reason: 'Network Policies and Ingress need improvement',
      suggestedActions: [
        'Practice Network Policy creation',
        'Study Ingress controller configuration'
      ]
    }
  ]
}

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'practice' | 'analytics'>('questions')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [sessionId] = useState(() => `practice_${Date.now()}`)
  const [isPracticing, setIsPracticing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeRemaining])

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestionId(questionId)
    const question = mockQuestions.find(q => q.id === questionId)
    if (question) {
      setTimeRemaining(question.timeLimit * 60) // Convert to seconds
      setActiveTab('practice')
      setIsPracticing(true)
    }
  }

  const handleStartExam = () => {
    setTimeRemaining(120 * 60) // 2 hours in seconds
    setIsTimerRunning(true)
    setActiveTab('practice')
    setIsPracticing(true)
  }

  const handleTimerToggle = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const handleTimerReset = () => {
    const question = mockQuestions.find(q => q.id === selectedQuestionId)
    if (question) {
      setTimeRemaining(question.timeLimit * 60)
      setIsTimerRunning(false)
    }
  }

  const handleHintUnlock = (hintId: string) => {
    console.log('Unlocking hint:', hintId)
    // In real app, update question hints state
  }

  const handleValidationCheck = (criteriaId: string) => {
    console.log('Checking validation:', criteriaId)
    // In real app, run validation command and update status
  }

  const handleQuestionComplete = (score: number, timeUsed: number) => {
    console.log('Question completed:', { score, timeUsed })
    setIsPracticing(false)
    setIsTimerRunning(false)
    // In real app, save results and update progress
  }

  const handleDomainFocus = (domain: string) => {
    console.log('Focusing on domain:', domain)
    // Filter questions by domain and switch to questions tab
    setActiveTab('questions')
  }

  const handleRecommendationAction = (domain: string, action: string) => {
    console.log('Starting recommendation action:', { domain, action })
    // Navigate to specific practice or study material
  }

  const selectedQuestion = mockQuestions.find(q => q.id === selectedQuestionId)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CKA Practice Mode</h1>
          <p className="text-gray-600">
            Practice individual questions or take full mock exams to prepare for your CKA certification
          </p>
        </div>

        {/* Practice Session Header */}
        {isPracticing && selectedQuestion && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="font-semibold">{selectedQuestion.title}</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Badge variant="outline">{selectedQuestion.domain}</Badge>
                      <span>{'★'.repeat(selectedQuestion.difficulty)}</span>
                      <span>Time Limit: {selectedQuestion.timeLimit}m</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      timeRemaining < 300 ? 'text-red-600' : 
                      timeRemaining < 600 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-xs text-gray-500">Time Remaining</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTimerToggle}
                    >
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTimerReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Question Library</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Practice Session</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Performance Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Question Library Tab */}
          <TabsContent value="questions">
            <QuestionManager
              questions={mockQuestions}
              currentQuestionId={selectedQuestionId || undefined}
              onQuestionSelect={handleQuestionSelect}
              onStartExam={handleStartExam}
              mode="practice"
            />
          </TabsContent>

          {/* Practice Session Tab */}
          <TabsContent value="practice">
            {isPracticing && selectedQuestion ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Terminal - Takes up 2/3 of the space */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Kubernetes Terminal</span>
                      </CardTitle>
                      <CardDescription>
                        Execute kubectl commands to complete the question requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-96">
                        <XTermComponent sessionId={sessionId} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Hints and Validation - Takes up 1/3 of the space */}
                <div className="lg:col-span-1">
                  <HintSystem
                    questionId={selectedQuestion.id}
                    hints={selectedQuestion.hints}
                    validationCriteria={selectedQuestion.validation}
                    timeRemaining={timeRemaining}
                    totalTime={selectedQuestion.timeLimit * 60}
                    onHintUnlock={handleHintUnlock}
                    onValidationCheck={handleValidationCheck}
                    onQuestionComplete={handleQuestionComplete}
                  />
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Question Selected</h3>
                  <p className="text-gray-600 mb-6">
                    Select a question from the Question Library to start practicing
                  </p>
                  <Button onClick={() => setActiveTab('questions')}>
                    Browse Questions
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <PerformanceDashboard
              performanceData={mockPerformanceData}
              onDomainFocus={handleDomainFocus}
              onRecommendationAction={handleRecommendationAction}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}