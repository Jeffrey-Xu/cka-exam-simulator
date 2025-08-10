'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Lightbulb, 
  Eye, 
  EyeOff, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Zap,
  Award
} from 'lucide-react'

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

interface HintSystemProps {
  questionId: string
  hints: Hint[]
  validationCriteria: ValidationCriteria[]
  timeRemaining: number
  totalTime: number
  onHintUnlock: (hintId: string) => void
  onValidationCheck: (criteriaId: string) => void
  onQuestionComplete: (score: number, timeUsed: number) => void
}

export default function HintSystem({
  questionId,
  hints,
  validationCriteria,
  timeRemaining,
  totalTime,
  onHintUnlock,
  onValidationCheck,
  onQuestionComplete
}: HintSystemProps) {
  const [activeTab, setActiveTab] = useState<'hints' | 'validation' | 'progress'>('hints')
  const [showSolution, setShowSolution] = useState(false)
  const [score, setScore] = useState(0)

  // Calculate progress metrics
  const timeUsed = totalTime - timeRemaining
  const timeUsedPercent = Math.round((timeUsed / totalTime) * 100)
  const hintsUsed = hints.filter(h => h.unlocked).length
  const totalPenalty = hints.filter(h => h.unlocked).reduce((sum, h) => sum + h.penaltyPoints, 0)
  const validationsPassed = validationCriteria.filter(v => v.status === 'passed').length
  const totalValidations = validationCriteria.length
  const validationScore = validationCriteria.filter(v => v.status === 'passed').reduce((sum, v) => sum + v.points, 0)
  const maxScore = validationCriteria.reduce((sum, v) => sum + v.points, 0)
  const currentScore = Math.max(0, validationScore - totalPenalty)

  useEffect(() => {
    setScore(currentScore)
  }, [currentScore])

  const getHintLevelColor = (level: Hint['level']) => {
    switch (level) {
      case 'basic': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'solution': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getHintLevelIcon = (level: Hint['level']) => {
    switch (level) {
      case 'basic': return <Lightbulb className="h-4 w-4" />
      case 'intermediate': return <Target className="h-4 w-4" />
      case 'advanced': return <Zap className="h-4 w-4" />
      case 'solution': return <Award className="h-4 w-4" />
    }
  }

  const getValidationStatusIcon = (status: ValidationCriteria['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'checking': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default: return <BookOpen className="h-4 w-4 text-gray-400" />
    }
  }

  const handleCompleteQuestion = () => {
    const finalScore = Math.max(0, currentScore)
    onQuestionComplete(finalScore, timeUsed)
  }

  return (
    <div className="space-y-4">
      {/* Score and Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentScore}</div>
              <div className="text-sm text-gray-500">Current Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validationsPassed}/{totalValidations}</div>
              <div className="text-sm text-gray-500">Validations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
              <div className="text-sm text-gray-500">Hints Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(timeRemaining / 60)}m</div>
              <div className="text-sm text-gray-500">Time Left</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('hints')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'hints' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lightbulb className="h-4 w-4 inline mr-2" />
          Hints ({hintsUsed}/{hints.length})
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'validation' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="h-4 w-4 inline mr-2" />
          Validation ({validationsPassed}/{totalValidations})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'progress' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="h-4 w-4 inline mr-2" />
          Progress
        </button>
      </div>

      {/* Hints Tab */}
      {activeTab === 'hints' && (
        <div className="space-y-3">
          {hints.map((hint, index) => (
            <Card key={hint.id} className={hint.unlocked ? '' : 'opacity-60'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getHintLevelIcon(hint.level)}
                    <span className="font-medium">{hint.title}</span>
                    <Badge className={getHintLevelColor(hint.level)}>
                      {hint.level}
                    </Badge>
                    {hint.penaltyPoints > 0 && (
                      <Badge variant="outline" className="text-red-600">
                        -{hint.penaltyPoints} pts
                      </Badge>
                    )}
                  </div>
                  
                  {!hint.unlocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onHintUnlock(hint.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Unlock Hint
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Used {hint.usedAt ? hint.usedAt.toLocaleTimeString() : 'now'}
                    </Badge>
                  )}
                </div>
                
                {hint.unlocked && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-900">{hint.content}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {hints.length === 0 && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                No hints available for this question. Use your knowledge and the documentation!
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="space-y-3">
          {validationCriteria.map((criteria) => (
            <Card key={criteria.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getValidationStatusIcon(criteria.status)}
                    <span className="font-medium">{criteria.description}</span>
                    <Badge variant="outline" className="text-green-600">
                      +{criteria.points} pts
                    </Badge>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onValidationCheck(criteria.id)}
                    disabled={criteria.status === 'checking'}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {criteria.status === 'checking' ? (
                      <>
                        <Clock className="h-4 w-4 mr-1 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
                
                {criteria.command && (
                  <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                    {criteria.command}
                  </div>
                )}
                
                {criteria.expectedOutput && criteria.status === 'failed' && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Expected:</strong> {criteria.expectedOutput}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleCompleteQuestion}
              className="bg-green-600 hover:bg-green-700"
              disabled={validationsPassed === 0}
            >
              Complete Question ({currentScore} points)
            </Button>
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Progress</CardTitle>
              <CardDescription>
                Track your performance and identify areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time Used</span>
                    <span>{Math.round(timeUsed / 60)}m / {Math.round(totalTime / 60)}m</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(timeUsedPercent, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Validations Passed</span>
                    <span>{validationsPassed} / {totalValidations}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(validationsPassed / totalValidations) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{maxScore}</div>
                    <div className="text-sm text-blue-800">Max Possible</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">-{totalPenalty}</div>
                    <div className="text-sm text-red-800">Hint Penalty</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Tips */}
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Performance Tips:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Try to solve without hints for maximum points</li>
                <li>• Use validation frequently to check your progress</li>
                <li>• Time management is crucial in the real exam</li>
                <li>• Focus on getting partial credit if stuck</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}