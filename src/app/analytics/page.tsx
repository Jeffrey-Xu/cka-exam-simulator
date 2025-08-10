'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PerformanceDashboard from '@/components/analytics/PerformanceDashboard'
import Link from 'next/link'
import { 
  TrendingUp, 
  Target, 
  Award, 
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Brain
} from 'lucide-react'

// Enhanced mock data for analytics demo
const demoPerformanceData = {
  overallStats: {
    totalQuestions: 16,
    completedQuestions: 12,
    averageScore: 82,
    totalTimeSpent: 480, // 8 hours
    currentStreak: 8,
    bestStreak: 15,
    examReadiness: 78
  },
  domainPerformance: [
    {
      domain: 'Troubleshooting (30%)',
      questionsCompleted: 3,
      totalQuestions: 5,
      averageScore: 75,
      averageTime: 22,
      weakAreas: ['Log Analysis', 'Resource Debugging', 'Network Issues'],
      trend: 'improving' as const
    },
    {
      domain: 'Cluster Architecture (25%)',
      questionsCompleted: 4,
      totalQuestions: 4,
      averageScore: 88,
      averageTime: 18,
      weakAreas: ['etcd Backup', 'Certificate Management'],
      trend: 'stable' as const
    },
    {
      domain: 'Services & Networking (20%)',
      questionsCompleted: 3,
      totalQuestions: 4,
      averageScore: 85,
      averageTime: 16,
      weakAreas: ['Network Policies', 'Ingress Configuration'],
      trend: 'improving' as const
    },
    {
      domain: 'Workloads & Scheduling (15%)',
      questionsCompleted: 2,
      totalQuestions: 2,
      averageScore: 92,
      averageTime: 14,
      weakAreas: [],
      trend: 'stable' as const
    },
    {
      domain: 'Storage (10%)',
      questionsCompleted: 1,
      totalQuestions: 1,
      averageScore: 95,
      averageTime: 12,
      weakAreas: [],
      trend: 'improving' as const
    }
  ],
  recentActivity: [
    {
      date: new Date('2025-08-10'),
      questionId: 'q15-etcd',
      questionTitle: 'ETCD Backup and Restore',
      domain: 'Cluster Architecture',
      score: 88,
      timeSpent: 1080, // 18 minutes
      hintsUsed: 1
    },
    {
      date: new Date('2025-08-09'),
      questionId: 'q4-networkpolicy',
      questionTitle: 'Network Policy Configuration',
      domain: 'Services & Networking',
      score: 82,
      timeSpent: 1200, // 20 minutes
      hintsUsed: 2
    },
    {
      date: new Date('2025-08-09'),
      questionId: 'q7-hpa',
      questionTitle: 'Horizontal Pod Autoscaler',
      domain: 'Workloads & Scheduling',
      score: 95,
      timeSpent: 900, // 15 minutes
      hintsUsed: 0
    },
    {
      date: new Date('2025-08-08'),
      questionId: 'q12-sidecar',
      questionTitle: 'Sidecar Container Pattern',
      domain: 'Workloads & Scheduling',
      score: 90,
      timeSpent: 840, // 14 minutes
      hintsUsed: 1
    },
    {
      date: new Date('2025-08-08'),
      questionId: 'q1-pvc',
      questionTitle: 'PersistentVolumeClaim with MariaDB',
      domain: 'Storage',
      score: 95,
      timeSpent: 720, // 12 minutes
      hintsUsed: 0
    }
  ],
  studyRecommendations: [
    {
      priority: 'high' as const,
      domain: 'Troubleshooting',
      reason: 'Highest exam weight (30%) with room for improvement. Focus on log analysis and resource debugging.',
      suggestedActions: [
        'Practice kubectl logs with different selectors',
        'Study resource constraint troubleshooting',
        'Review cluster component failure scenarios',
        'Practice network connectivity debugging'
      ]
    },
    {
      priority: 'medium' as const,
      domain: 'Services & Networking',
      reason: 'Network Policies and Ingress need attention. These are common exam topics.',
      suggestedActions: [
        'Create complex Network Policy scenarios',
        'Practice Ingress with multiple backends',
        'Study DNS troubleshooting in clusters'
      ]
    },
    {
      priority: 'low' as const,
      domain: 'Cluster Architecture',
      reason: 'Strong performance overall, but etcd operations need practice.',
      suggestedActions: [
        'Practice etcd backup and restore procedures',
        'Review certificate renewal processes'
      ]
    }
  ]
}

export default function AnalyticsPage() {
  const handleDomainFocus = (domain: string) => {
    console.log('Demo: Focusing on domain:', domain)
    // In real app, this would filter questions and navigate to practice
  }

  const handleRecommendationAction = (domain: string, action: string) => {
    console.log('Demo: Starting action:', { domain, action })
    // In real app, this would start specific practice sessions
  }

  const analyticsFeatures = [
    {
      icon: Target,
      title: 'Exam Readiness Score',
      description: 'AI-calculated readiness based on performance across all domains',
      value: '78%'
    },
    {
      icon: BarChart3,
      title: 'Domain Analysis',
      description: 'Detailed breakdown by CKA exam domains with trend analysis',
      value: '5 Domains'
    },
    {
      icon: Activity,
      title: 'Progress Tracking',
      description: 'Track your improvement over time with detailed metrics',
      value: '8 Day Streak'
    },
    {
      icon: Brain,
      title: 'Smart Recommendations',
      description: 'Personalized study suggestions based on your weak areas',
      value: 'AI-Powered'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Performance Analytics Demo
              </h1>
              <p className="text-gray-600">
                Experience our AI-powered analytics that help you identify weak areas and optimize your study time
              </p>
            </div>
            <Link href="/practice">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Start Practicing
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Notice */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Interactive Analytics Demo
                </h3>
                <p className="text-blue-800 mb-4">
                  This is a demonstration of our analytics system using sample data. 
                  In the real application, all metrics are calculated from your actual practice sessions 
                  and provide personalized insights to accelerate your CKA preparation.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Real-time Updates
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    AI Recommendations
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Progress Tracking
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Weak Area Detection
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analyticsFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {feature.value}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Analytics Dashboard */}
        <PerformanceDashboard
          performanceData={demoPerformanceData}
          onDomainFocus={handleDomainFocus}
          onRecommendationAction={handleRecommendationAction}
        />

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-white" />
            <h3 className="text-2xl font-bold mb-4">
              Ready to Track Your Real Progress?
            </h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Start practicing with our comprehensive question library and watch your 
              analytics come to life. Get personalized recommendations and track your 
              journey to CKA certification success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/practice">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  <Target className="mr-2 h-5 w-5" />
                  Start Practice Mode
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}