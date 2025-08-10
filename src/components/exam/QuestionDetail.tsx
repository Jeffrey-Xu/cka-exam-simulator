'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Clock, 
  Target, 
  Server,
  Play,
  ArrowLeft
} from 'lucide-react'

interface Question {
  id: string
  title: string
  domain: string
  difficulty: number
  timeLimit: number
  description: string
  fullQuestion: string
  environment: string
  answer: string
  hints: any[]
  validation: any[]
  status: string
  attempts: number
}

interface QuestionDetailProps {
  question: Question
  onStartPractice: () => void
  onBack: () => void
}

export default function QuestionDetail({ question, onStartPractice, onBack }: QuestionDetailProps) {
  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 4) return 'text-red-600'
    if (difficulty >= 3) return 'text-orange-600'
    if (difficulty >= 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatQuestionText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 list-disc">
            {line.substring(2)}
          </li>
        )
      }
      if (line.trim() === '') {
        return <br key={index} />
      }
      return (
        <p key={index} className="mb-2">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Questions</span>
        </Button>
        <Button onClick={onStartPractice} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
          <Play className="h-4 w-4" />
          <span>Start Practice</span>
        </Button>
      </div>

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{question.title}</CardTitle>
              <CardDescription className="mt-2">
                {question.description}
              </CardDescription>
            </div>
            <div className="text-right space-y-2">
              <Badge variant="outline" className="block">
                {question.domain}
              </Badge>
              <div className={`text-lg font-semibold ${getDifficultyColor(question.difficulty)}`}>
                {getDifficultyStars(question.difficulty)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="font-semibold">{question.timeLimit} minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="font-semibold">Level {question.difficulty}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Attempts</p>
                <p className="font-semibold">{question.attempts}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{question.status.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Question</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {formatQuestionText(question.fullQuestion)}
            </div>
          </CardContent>
        </Card>

        {/* Environment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Environment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {formatQuestionText(question.environment)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hints and Validation Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Hints */}
        <Card>
          <CardHeader>
            <CardTitle>Available Hints</CardTitle>
            <CardDescription>
              Progressive hints are available during practice (with point penalties)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.hints.map((hint, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{hint.title}</p>
                    <p className="text-sm text-gray-600 capitalize">{hint.level} level</p>
                  </div>
                  <Badge variant="outline" className="text-red-600">
                    -{hint.penaltyPoints} pts
                  </Badge>
                </div>
              ))}
              {question.hints.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hints available - rely on your knowledge and documentation!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Validation Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Criteria</CardTitle>
            <CardDescription>
              Your solution will be validated against these requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.validation.map((criteria, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{criteria.description}</p>
                    {criteria.command && (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {criteria.command}
                      </code>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    +{criteria.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start Practice CTA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Ready to Practice?</h3>
          <p className="text-gray-600 mb-4">
            You'll have {question.timeLimit} minutes to complete this question. 
            Use hints wisely as they reduce your final score.
          </p>
          <Button onClick={onStartPractice} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Play className="mr-2 h-5 w-5" />
            Start Practice Session
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}