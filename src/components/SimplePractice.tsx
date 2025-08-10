import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Play, BookOpen, Network, Server, Settings, Wrench, Terminal as TerminalIcon } from 'lucide-react';
import questionsData from '@/data/questions.json';
import dynamic from 'next/dynamic';
import { generateId } from '@/lib/utils';

// Dynamically import Terminal to avoid SSR issues
const Terminal = dynamic(() => import('@/components/terminal/Terminal'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-900 text-white rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading terminal...</p>
      </div>
    </div>
  )
});

interface Question {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  task: string;
  environment: string;
  preparation: string;
  steps: string;
  diagram: string;
  tips: string;
}

const SimplePractice: React.FC = () => {
  // Sort questions by ID (Q1, Q2, Q3, etc.)
  const [questions] = useState<Question[]>(
    questionsData.sort((a, b) => {
      const aNum = parseInt(a.id.replace('Q', ''));
      const bNum = parseInt(b.id.replace('Q', ''));
      return aNum - bNum;
    })
  );
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [environmentReady, setEnvironmentReady] = useState<boolean>(false);
  const [terminalSessionId, setTerminalSessionId] = useState<string>('');

  useEffect(() => {
    // Load first question by default
    if (questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
    
    // Initialize terminal session ID
    setTerminalSessionId(`practice-${generateId()}`);
  }, [questions]);

  const prepareEnvironment = async (questionId: string) => {
    setEnvironmentReady(false);
    
    // Simulate environment preparation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEnvironmentReady(true);
  };

  const markCompleted = (questionId: string) => {
    setCompletedQuestions(prev => new Set([...prev, questionId]));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Storage': return <Server className="h-4 w-4" />;
      case 'Services & Networking': return <Network className="h-4 w-4" />;
      case 'Workloads & Scheduling': return <Settings className="h-4 w-4" />;
      case 'Troubleshooting': return <Wrench className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Storage': return 'text-blue-600';
      case 'Services & Networking': return 'text-green-600';
      case 'Workloads & Scheduling': return 'text-purple-600';
      case 'Troubleshooting': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatSteps = (steps: string) => {
    // Clean up the steps text and format for better display
    return steps
      .replace(/\[candidate@.*?\]/g, '[candidate@master]') // Normalize prompts
      .replace(/ec2-\d+-\d+-\d+-\d+\.compute-1\.amazonaws\.com/g, 'master01') // Simplify DNS names in display
      .trim();
  };

  const categoryStats = questions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">CKA Practice Lab</h1>
          <p className="text-lg text-gray-600 mb-4">
            Master Kubernetes with 16 validated CKA questions and live terminal access to a real AWS cluster
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <Server className="h-4 w-4 mr-2" />
              AWS EC2 Environment
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-green-50 border-green-200 text-green-800">
              <TerminalIcon className="h-4 w-4 mr-2" />
              Live Terminal
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Kubernetes v1.28.15
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {completedQuestions.size}/{questions.length} Completed
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(categoryStats).map(([category, count]) => (
            <Card key={category} className="text-center">
              <CardContent className="p-4">
                <div className={`flex items-center justify-center mb-2 ${getCategoryColor(category)}`}>
                  {getCategoryIcon(category)}
                  <span className="ml-2 font-medium">{count}</span>
                </div>
                <p className="text-sm text-gray-600">{category}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question List */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      currentQuestion?.id === question.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setCurrentQuestion(question);
                      setEnvironmentReady(false);
                      // Generate new terminal session for each question
                      setTerminalSessionId(`practice-${generateId()}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={getCategoryColor(question.category)}>
                          {getCategoryIcon(question.category)}
                        </div>
                        <span className="font-bold text-sm">{question.id}</span>
                        {completedQuestions.has(question.id) && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{question.title}</h3>
                    <p className={`text-xs ${getCategoryColor(question.category)}`}>
                      {question.category}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Question Details */}
          <div className="lg:col-span-3">
            {currentQuestion ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <div className={getCategoryColor(currentQuestion.category)}>
                          {getCategoryIcon(currentQuestion.category)}
                        </div>
                        <span>{currentQuestion.id}: {currentQuestion.title}</span>
                      </CardTitle>
                      <p className={`text-sm ${getCategoryColor(currentQuestion.category)}`}>
                        {currentQuestion.category}
                      </p>
                    </div>
                    <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="task" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="task">Task</TabsTrigger>
                      <TabsTrigger value="environment">Environment</TabsTrigger>
                      <TabsTrigger value="terminal">Terminal</TabsTrigger>
                      <TabsTrigger value="steps">Solution</TabsTrigger>
                      <TabsTrigger value="diagram">Architecture</TabsTrigger>
                    </TabsList>

                    <TabsContent value="task" className="mt-6">
                      <div className="space-y-6">
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Task Description
                          </h3>
                          <div className="text-blue-800 whitespace-pre-line leading-relaxed">
                            {currentQuestion.task}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => prepareEnvironment(currentQuestion.id)}
                            disabled={environmentReady}
                            className="flex items-center gap-2"
                            size="lg"
                          >
                            <Play className="h-4 w-4" />
                            {environmentReady ? 'Environment Ready ✓' : 'Prepare Environment'}
                          </Button>
                          
                          {environmentReady && (
                            <Button
                              variant="outline"
                              onClick={() => markCompleted(currentQuestion.id)}
                              className="flex items-center gap-2"
                              size="lg"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="environment" className="mt-6">
                      <div className="space-y-6">
                        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            Environment Setup
                          </h3>
                          <div className="text-green-800 whitespace-pre-line leading-relaxed">
                            {currentQuestion.environment}
                          </div>
                        </div>
                        
                        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Network className="h-5 w-5" />
                            AWS Infrastructure
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-white rounded border">
                              <div className="font-medium text-blue-600 mb-1">Master Node</div>
                              <div className="text-gray-600 text-xs">ec2-34-201-252-187.compute-1.amazonaws.com</div>
                              <div className="text-gray-500 text-xs">172.31.80.10</div>
                            </div>
                            <div className="p-3 bg-white rounded border">
                              <div className="font-medium text-green-600 mb-1">Worker Node</div>
                              <div className="text-gray-600 text-xs">ec2-54-144-18-63.compute-1.amazonaws.com</div>
                              <div className="text-gray-500 text-xs">172.31.80.11</div>
                            </div>
                            <div className="p-3 bg-white rounded border">
                              <div className="font-medium text-purple-600 mb-1">SSH Proxy</div>
                              <div className="text-gray-600 text-xs">ec2-13-222-51-177.compute-1.amazonaws.com</div>
                              <div className="text-gray-500 text-xs">172.31.81.75</div>
                            </div>
                          </div>
                        </div>

                        {currentQuestion.preparation && (
                          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h3 className="font-semibold text-yellow-900 mb-3">Preparation Steps</h3>
                            <div className="text-yellow-800 whitespace-pre-line leading-relaxed">
                              {currentQuestion.preparation}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="terminal" className="mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <TerminalIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-900">Live Kubernetes Terminal</h3>
                              <p className="text-sm text-blue-700">
                                Connected to real AWS Kubernetes cluster - Practice kubectl commands
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-blue-700 font-medium">Live</span>
                          </div>
                        </div>
                        
                        <div className="h-96 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                          {terminalSessionId && (
                            <Terminal 
                              sessionId={terminalSessionId}
                              className="h-full"
                              onCommand={(command) => {
                                console.log('Command executed:', command);
                                // You can add command logging or analytics here
                              }}
                            />
                          )}
                        </div>
                        
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-yellow-100 rounded">
                              <Wrench className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-yellow-900 mb-1">Terminal Tips</h4>
                              <ul className="text-sm text-yellow-800 space-y-1">
                                <li>• Use this terminal to practice the current question's kubectl commands</li>
                                <li>• All commands execute on a real 2-node Kubernetes cluster</li>
                                <li>• Check the Solution tab for step-by-step guidance</li>
                                <li>• Terminal session persists while you navigate between tabs</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="steps" className="mt-6">
                      <div className="p-6 bg-gray-900 rounded-lg border">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Step-by-Step Solution
                        </h3>
                        <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed">
                          {formatSteps(currentQuestion.steps)}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="diagram" className="mt-6">
                      <div className="space-y-6">
                        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                          <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <Network className="h-5 w-5" />
                            System Architecture
                          </h3>
                          <div className="text-purple-800 whitespace-pre-line leading-relaxed">
                            {currentQuestion.diagram || 'System architecture diagram showing the components and their relationships.'}
                          </div>
                        </div>
                        
                        {currentQuestion.tips && (
                          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                              <Wrench className="h-5 w-5" />
                              Key Tips & Best Practices
                            </h3>
                            <div className="text-yellow-800 whitespace-pre-line leading-relaxed">
                              {currentQuestion.tips}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Question</h3>
                    <p className="text-gray-600">Choose a question from the list to start practicing</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePractice;