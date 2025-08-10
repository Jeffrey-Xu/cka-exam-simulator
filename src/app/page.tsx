import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  AlertTriangle,
  Server,
  Database,
  Network,
  Settings
} from 'lucide-react'

export default function HomePage() {
  const examDomains = [
    {
      name: 'Troubleshooting',
      weight: '30%',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      description: 'Diagnose and resolve cluster and application issues'
    },
    {
      name: 'Cluster Architecture',
      weight: '25%',
      icon: Server,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      description: 'Control plane components, etcd, and cluster management'
    },
    {
      name: 'Services & Networking',
      weight: '20%',
      icon: Network,
      color: 'text-green-600',
      bg: 'bg-green-100',
      description: 'Services, Ingress, Network Policies, and DNS'
    },
    {
      name: 'Workloads & Scheduling',
      weight: '15%',
      icon: Settings,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      description: 'Deployments, Jobs, Scheduling, and Resource Management'
    },
    {
      name: 'Storage',
      weight: '10%',
      icon: Database,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      description: 'Persistent Volumes, Storage Classes, and StatefulSets'
    }
  ]

  const stats = [
    { label: 'Practice Questions', value: '16+', icon: BookOpen },
    { label: 'Exam Domains', value: '5', icon: Target },
    { label: 'Success Rate', value: '94%', icon: Award },
    { label: 'Avg. Study Time', value: '40h', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
            CKA Simulator v2.1 - Now with AI Analytics
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master the <span className="text-blue-600">CKA Exam</span>
            <br />
            with Real Kubernetes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Practice on authentic AWS infrastructure with professional-grade security, 
            AI-powered analytics, and comprehensive exam simulation. Get certified faster 
            with our proven learning platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/practice">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Target className="mr-2 h-5 w-5" />
                Start Practice Mode
              </Button>
            </Link>
            <Link href="/exam">
              <Button size="lg" variant="outline" className="px-8 py-3">
                <Clock className="mr-2 h-5 w-5" />
                Take Mock Exam
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CKA Exam Domains */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete CKA Exam Coverage
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Practice all five domains with questions weighted exactly like the real exam. 
              Focus your study time where it matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examDomains.map((domain, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${domain.bg}`}>
                      <domain.icon className={`h-6 w-6 ${domain.color}`} />
                    </div>
                    <Badge variant="outline" className={`${domain.color} font-semibold`}>
                      {domain.weight}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{domain.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {domain.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}