'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, CheckCircle, AlertCircle, BookOpen, Target, TrendingUp } from 'lucide-react'

interface Hint {
  id: string
  level: 'basic' | 'intermediate' | 'advanced' | 'solution'
  title: string
  content: string
  penaltyPoints: number
  unlocked: boolean
  usedAt?: Date
}

interface ValidationCriteria {
  id: string
  description: string
  command?: string
  expectedOutput?: string
  status: 'pending' | 'checking' | 'passed' | 'failed'
  points: number
}

interface Question {
  id: string
  title: string
  domain: string
  difficulty: number
  timeLimit: number
  description: string
  hints: Hint[]
  validation: ValidationCriteria[]
  status: 'not-started' | 'in-progress' | 'completed' | 'failed'
  attempts: number
  bestTime?: number
  lastAttempt?: Date
}

interface QuestionManagerProps {
  questions: Question[]
  currentQuestionId?: string
  onQuestionSelect: (questionId: string) => void
  onStartExam: () => void
  mode: 'practice' | 'exam' | 'review'
}

export default function QuestionManager({ 
  questions, 
  currentQuestionId, 
  onQuestionSelect, 
  onStartExam,
  mode 
}: QuestionManagerProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'title' | 'domain' | 'difficulty' | 'status'>('domain')

  // Calculate statistics
  const stats = {
    total: questions.length,
    completed: questions.filter(q => q.status === 'completed').length,
    inProgress: questions.filter(q => q.status === 'in-progress').length,
    notStarted: questions.filter(q => q.status === 'not-started').length,
    failed: questions.filter(q => q.status === 'failed').length
  }

  const completionRate = Math.round((stats.completed / stats.total) * 100)

  // Get unique domains
  const domains = ['all', ...Array.from(new Set(questions.map(q => q.domain)))]

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(q => selectedDomain === 'all' || q.domain === selectedDomain)
    .filter(q => selectedDifficulty === 'all' || q.difficulty.toString() === selectedDifficulty)
    .sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title)
        case 'domain': return a.domain.localeCompare(b.domain)
        case 'difficulty': return a.difficulty - b.difficulty
        case 'status': return a.status.localeCompare(b.status)
        default: return 0
      }
    })

  const getStatusIcon = (status: Question['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in-progress': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <BookOpen className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: Question['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Questions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{stats.completed}/{stats.total} questions completed</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question Library</span>
            {mode === 'exam' && (
              <Button onClick={onStartExam} className="bg-red-600 hover:bg-red-700">
                Start Full Exam (2 Hours)
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Select questions to practice or review your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Domain Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain</label>
              <select 
                value={selectedDomain} 
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {domains.map(domain => (
                  <option key={domain} value={domain}>
                    {domain === 'all' ? 'All Domains' : domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Levels</option>
                <option value="1">★☆☆☆☆ (Basic)</option>
                <option value="2">★★☆☆☆ (Easy)</option>
                <option value="3">★★★☆☆ (Medium)</option>
                <option value="4">★★★★☆ (Hard)</option>
                <option value="5">★★★★★ (Expert)</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="domain">Domain</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.map((question) => (
              <Card 
                key={question.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentQuestionId === question.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onQuestionSelect(question.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(question.status)}
                        <h3 className="font-medium">{question.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {question.domain}
                        </Badge>
                        <span className="text-sm text-yellow-600">
                          {getDifficultyStars(question.difficulty)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {question.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>⏱️ {question.timeLimit} min</span>
                        <span>🔄 {question.attempts} attempts</span>
                        {question.bestTime && (
                          <span>⚡ Best: {question.bestTime} min</span>
                        )}
                        {question.lastAttempt && (
                          <span>📅 Last: {question.lastAttempt.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Badge className={getStatusColor(question.status)}>
                        {question.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions match your current filters.</p>
              <p className="text-sm">Try adjusting your domain or difficulty selection.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}