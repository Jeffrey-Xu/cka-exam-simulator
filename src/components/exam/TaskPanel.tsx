'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  Clock, 
  Target, 
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertCircle
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

interface TaskPanelProps {
  question: Question
  timeRemaining: number
  totalTime: number
}

export default function TaskPanel({ question, timeRemaining, totalTime }: TaskPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('task')

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
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-3 ml-4">
              {currentList.map((item, i) => (
                <li key={i} className="text-sm text-gray-700">{item}</li>
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
            <h4 key={index} className="font-semibold text-gray-900 mb-2 mt-3 text-sm">
              {trimmedLine}
            </h4>
          )
        } else {
          elements.push(
            <p key={index} className="mb-2 text-sm text-gray-700 leading-relaxed">
              {trimmedLine}
            </p>
          )
        }
      }
    })
    
    // Handle any remaining list items
    if (currentList.length > 0) {
      elements.push(
        <ul key="final-list" className="list-disc list-inside space-y-1 mb-3 ml-4">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm text-gray-700">{item}</li>
          ))}
        </ul>
      )
    }
    
    return <div className="prose prose-sm max-w-none">{elements}</div>
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
  const timeUsedPercent = Math.round(((totalTime - timeRemaining) / totalTime) * 100)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Task Details</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className={timeRemaining < 300 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {question.domain}
            </Badge>
            <div className="text-xs text-gray-500">
              {timeUsedPercent}% time used
            </div>
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="task" className="text-xs">Task</TabsTrigger>
              <TabsTrigger value="environment" className="text-xs">Environment</TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">Validation</TabsTrigger>
            </TabsList>

            {/* Task Tab */}
            <TabsContent value="task" className="mt-3">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">
                    {question.title}
                  </h4>
                  <p className="text-xs text-blue-800">
                    {question.description}
                  </p>
                </div>

                {taskSteps.length > 0 ? (
                  <div className="space-y-3">
                    {taskSteps.map((step, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <h5 className="font-medium text-gray-900 text-xs">Step {index + 1}</h5>
                        </div>
                        <div className="text-xs">
                          {formatTaskText(step.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {formatTaskText(question.fullQuestion)}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment" className="mt-3">
              <div className="bg-gray-50 p-3 rounded-lg max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">Cluster Environment</h4>
                {formatTaskText(question.environment)}
              </div>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="mt-3">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">Success Criteria</h4>
                {question.validation.map((criteria, index) => (
                  <div key={index} className="bg-green-50 p-2 rounded border-l-2 border-green-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-xs text-green-900">{criteria.description}</p>
                      <Badge variant="outline" className="text-xs text-green-600">
                        +{criteria.points}pts
                      </Badge>
                    </div>
                    {criteria.command && (
                      <code className="text-xs bg-green-100 px-2 py-1 rounded block mt-1 text-green-800">
                        {criteria.command}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Progress: {taskSteps.length > 0 ? taskSteps.length : 1} steps</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3" />
                <span>Validate as you go</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}