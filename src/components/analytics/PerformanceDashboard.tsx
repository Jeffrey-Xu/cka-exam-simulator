'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  AlertTriangle,
  BookOpen,
  BarChart3,
  PieChart,
  Calendar,
  Zap,
  CheckCircle
} from 'lucide-react'

interface PerformanceData {
  overallStats: {
    totalQuestions: number
    completedQuestions: number
    averageScore: number
    totalTimeSpent: number
    currentStreak: number
    bestStreak: number
    examReadiness: number
  }
  domainPerformance: {
    domain: string
    questionsCompleted: number
    totalQuestions: number
    averageScore: number
    averageTime: number
    weakAreas: string[]
    trend: 'improving' | 'declining' | 'stable'
  }[]
  recentActivity: {
    date: Date
    questionId: string
    questionTitle: string
    domain: string
    score: number
    timeSpent: number
    hintsUsed: number
  }[]
  studyRecommendations: {
    priority: 'high' | 'medium' | 'low'
    domain: string
    reason: string
    suggestedActions: string[]
  }[]
}

interface PerformanceDashboardProps {
  performanceData: PerformanceData
  onDomainFocus: (domain: string) => void
  onRecommendationAction: (domain: string, action: string) => void
}

export default function PerformanceDashboard({ 
  performanceData, 
  onDomainFocus,
  onRecommendationAction 
}: PerformanceDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('week')
  
  const { overallStats, domainPerformance, recentActivity, studyRecommendations } = performanceData

  // Calculate exam readiness
  const getReadinessLevel = (score: number) => {
    if (score >= 85) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 75) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 66) return { level: 'Pass Level', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Needs Work', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const readiness = getReadinessLevel(overallStats.examReadiness)

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((overallStats.completedQuestions / overallStats.totalQuestions) * 100)}%
                </p>
                <p className="text-xs text-gray-500">
                  {overallStats.completedQuestions}/{overallStats.totalQuestions} questions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold">{overallStats.averageScore}%</p>
                <p className="text-xs text-gray-500">
                  {overallStats.averageScore >= 66 ? 'Above pass level' : 'Below pass level'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Current Streak</p>
                <p className="text-2xl font-bold">{overallStats.currentStreak}</p>
                <p className="text-xs text-gray-500">
                  Best: {overallStats.bestStreak} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Exam Readiness</p>
                <p className={`text-2xl font-bold ${readiness.color}`}>
                  {overallStats.examReadiness}%
                </p>
                <Badge className={`text-xs ${readiness.bg} ${readiness.color}`}>
                  {readiness.level}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Readiness Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>CKA Exam Readiness</span>
          </CardTitle>
          <CardDescription>
            Based on your performance across all domains. 66% is the minimum passing score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Level: {readiness.level}</span>
              <span>{overallStats.examReadiness}% / 100%</span>
            </div>
            <Progress value={overallStats.examReadiness} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="text-yellow-600">66% (Pass)</span>
              <span className="text-green-600">85% (Excellent)</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domains">Domain Analysis</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="recommendations">Study Plan</TabsTrigger>
          <TabsTrigger value="trends">Progress Trends</TabsTrigger>
        </TabsList>

        {/* Domain Performance */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Domain</CardTitle>
              <CardDescription>
                Detailed breakdown of your performance across all CKA exam domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {domainPerformance.map((domain) => (
                  <Card key={domain.domain} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{domain.domain}</h3>
                        {getTrendIcon(domain.trend)}
                        <Badge variant="outline" className="text-xs">
                          {domain.questionsCompleted}/{domain.totalQuestions} completed
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDomainFocus(domain.domain)}
                      >
                        Focus Practice
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Average Score</p>
                        <p className="text-lg font-semibold">{domain.averageScore}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Time</p>
                        <p className="text-lg font-semibold">{Math.round(domain.averageTime)}m</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion</p>
                        <Progress 
                          value={(domain.questionsCompleted / domain.totalQuestions) * 100} 
                          className="h-2 mt-1"
                        />
                      </div>
                    </div>
                    
                    {domain.weakAreas.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Areas for Improvement:</p>
                        <div className="flex flex-wrap gap-2">
                          {domain.weakAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs text-orange-600">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Practice Sessions</span>
              </CardTitle>
              <CardDescription>
                Your latest question attempts and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-medium">{activity.questionTitle}</h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.domain}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.date.toLocaleDateString()} • {Math.round(activity.timeSpent / 60)}m • {activity.hintsUsed} hints used
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        activity.score >= 80 ? 'text-green-600' : 
                        activity.score >= 66 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {activity.score}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity found.</p>
                    <p className="text-sm">Start practicing to see your progress here!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Personalized Study Recommendations</span>
              </CardTitle>
              <CardDescription>
                AI-powered suggestions based on your performance patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyRecommendations.map((rec, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <h4 className="font-medium">{rec.domain}</h4>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Suggested Actions:</p>
                      <ul className="space-y-1">
                        {rec.suggestedActions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-center justify-between text-sm">
                            <span>• {action}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRecommendationAction(rec.domain, action)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Start
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                ))}
                
                {studyRecommendations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Great job! No specific recommendations at this time.</p>
                    <p className="text-sm">Keep practicing to maintain your progress!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Progress Trends</span>
              </CardTitle>
              <CardDescription>
                Visual representation of your learning progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Score Trend */}
                <div>
                  <h4 className="font-medium mb-3">Score Improvement Trend</h4>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
                
                {/* Time Efficiency */}
                <div>
                  <h4 className="font-medium mb-3">Time Efficiency Trend</h4>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Time efficiency chart would go here</p>
                  </div>
                </div>
                
                {/* Domain Mastery */}
                <div>
                  <h4 className="font-medium mb-3">Domain Mastery Progress</h4>
                  <div className="space-y-3">
                    {domainPerformance.map((domain) => (
                      <div key={domain.domain}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{domain.domain}</span>
                          <span>{domain.averageScore}%</span>
                        </div>
                        <Progress value={domain.averageScore} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}