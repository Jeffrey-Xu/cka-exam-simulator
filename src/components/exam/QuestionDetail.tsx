'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Clock, 
  Target, 
  Server,
  Play,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Terminal,
  FileText,
  Settings
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
  const [showSolution, setShowSolution] = useState(false)

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 4) return 'text-red-600'
    if (difficulty >= 3) return 'text-orange-600'
    if (difficulty >= 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatTaskText = (text: string) => {
    if (!text) return null
    
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        currentList.push(trimmedLine.substring(2))
      } else {
        // If we have accumulated list items, render them
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-4 ml-4">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        
        if (trimmedLine === '') {
          elements.push(<div key={index} className="mb-2" />)
        } else if (trimmedLine.includes(':') && !trimmedLine.startsWith('[') && !trimmedLine.includes('$')) {
          // Likely a section header
          elements.push(
            <h4 key={index} className="font-semibold text-gray-900 mb-2 mt-4">
              {trimmedLine}
            </h4>
          )
        } else {
          elements.push(
            <p key={index} className="mb-2 text-gray-700 leading-relaxed">
              {trimmedLine}
            </p>
          )
        }
      }
    })
    
    // Handle any remaining list items
    if (currentList.length > 0) {
      elements.push(
        <ul key="final-list" className="list-disc list-inside space-y-1 mb-4 ml-4">
          {currentList.map((item, i) => (
            <li key={i} className="text-gray-700">{item}</li>
          ))}
        </ul>
      )
    }
    
    return <div className="prose prose-sm max-w-none">{elements}</div>
  }

  const formatCommandOutput = (text: string) => {
    if (!text) return null
    
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    
    lines.forEach((line, index) => {
      if (line.includes('$') && (line.includes('kubectl') || line.includes('vim') || line.includes('ssh'))) {
        // Command line
        elements.push(
          <div key={index} className="bg-gray-900 text-green-400 p-2 rounded font-mono text-sm mb-2">
            {line}
          </div>
        )
      } else if (line.startsWith('NAME') || line.includes('STATUS') || line.includes('READY')) {
        // Table header
        elements.push(
          <div key={index} className="bg-blue-50 p-2 rounded font-mono text-xs text-blue-900 mb-1">
            {line}
          </div>
        )
      } else if (line.includes('apiVersion:') || line.includes('kind:') || line.includes('metadata:')) {
        // YAML content
        elements.push(
          <div key={index} className="bg-yellow-50 p-1 font-mono text-xs text-yellow-900">
            {line}
          </div>
        )
      } else if (line.trim() && !line.startsWith('#') && !line.startsWith('//')) {
        // Regular output
        elements.push(
          <div key={index} className="text-gray-700 font-mono text-sm mb-1">
            {line}
          </div>
        )
      } else if (line.startsWith('#')) {
        // Comments
        elements.push(
          <div key={index} className="text-green-600 text-sm mb-1 italic">
            {line}
          </div>
        )
      }
    })
    
    return <div className="space-y-1">{elements}</div>
  }

  const extractTaskSteps = (fullQuestion: string) => {
    const steps = []
    const lines = fullQuestion.split('\n')
    let currentStep = ''
    let stepNumber = 1
    
    for (const line of lines) {
      if (line.trim().match(/^\d+\./)) {
        if (currentStep) {
          steps.push({ number: stepNumber - 1, content: currentStep.trim() })
        }
        currentStep = line
        stepNumber++
      } else if (line.trim().startsWith('Create') || line.trim().startsWith('Edit') || line.trim().startsWith('Apply') || line.trim().startsWith('Ensure')) {
        if (currentStep) {
          steps.push({ number: stepNumber - 1, content: currentStep.trim() })
        }
        currentStep = line
        stepNumber++
      } else {
        currentStep += '\n' + line
      }
    }
    
    if (currentStep) {
      steps.push({ number: stepNumber - 1, content: currentStep.trim() })
    }
    
    return steps
  }

  const taskSteps = extractTaskSteps(question.fullQuestion)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Questions</span>
        </Button>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>{showSolution ? 'Hide' : 'Show'} Solution</span>
          </Button>
          <Button onClick={onStartPractice} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>Start Practice</span>
          </Button>
        </div>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="task" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="task">Task Details</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="hints">Hints</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Task Details Tab */}
        <TabsContent value="task">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Task Requirements</span>
              </CardTitle>
              <CardDescription>
                Complete the following tasks in the specified order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskSteps.length > 0 ? (
                <div className="space-y-6">
                  {taskSteps.map((step, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <h4 className="font-semibold text-gray-900">Step {index + 1}</h4>
                      </div>
                      {formatTaskText(step.content)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Task Description</h4>
                  {formatTaskText(question.fullQuestion)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environment Tab */}
        <TabsContent value="environment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Cluster Environment</span>
              </CardTitle>
              <CardDescription>
                Your practice environment specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                {formatTaskText(question.environment)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hints Tab */}
        <TabsContent value="hints">
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
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation">
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
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
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
        </TabsContent>
      </Tabs>

      {/* Solution Section (if shown) */}
      {showSolution && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <span>Complete Solution</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              ⚠️ Viewing the solution will affect your practice score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border">
              {formatCommandOutput(question.answer)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Practice CTA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Terminal className="h-12 w-12 mx-auto mb-4 text-blue-600" />
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