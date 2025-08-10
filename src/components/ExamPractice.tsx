'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Play, 
  BookOpen, 
  Network, 
  Server, 
  Settings, 
  Wrench, 
  Terminal as TerminalIcon,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import questionsData from '@/data/questions.json';
import dynamic from 'next/dynamic';
import { generateId } from '@/lib/utils';
import '../app/exam-layout.css';

// Dynamically import Terminal to avoid SSR issues
const Terminal = dynamic(() => import('@/components/terminal/Terminal'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
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

const ExamPractice: React.FC = () => {
  // Sort questions by ID (Q1, Q2, Q3, etc.)
  const [questions] = useState<Question[]>(
    questionsData.sort((a, b) => {
      const aNum = parseInt(a.id.replace('Q', ''));
      const bNum = parseInt(b.id.replace('Q', ''));
      return aNum - bNum;
    })
  );
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [terminalSessionId, setTerminalSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('task');

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    // Initialize terminal session ID
    setTerminalSessionId(`exam-${generateId()}`);
  }, []);

  // Generate new terminal session when question changes
  useEffect(() => {
    setTerminalSessionId(`exam-${generateId()}`);
    setActiveTab('task'); // Reset to task tab when changing questions
  }, [currentQuestionIndex]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const markCompleted = () => {
    if (currentQuestion) {
      setCompletedQuestions(prev => new Set([...prev, currentQuestion.id]));
    }
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
      case 'Storage': return 'text-blue-600 bg-blue-50';
      case 'Services & Networking': return 'text-green-600 bg-green-50';
      case 'Workloads & Scheduling': return 'text-purple-600 bg-purple-50';
      case 'Troubleshooting': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!currentQuestion) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
          <p className="text-gray-600">Please check your question data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-container bg-gray-100 flex flex-col">
      {/* Top Header - Question Inventory */}
      <div className="exam-header bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">CKA Practice Exam</h1>
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-4 w-4 mr-2" />
              Practice Mode
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-green-50 border-green-200 text-green-800">
              <TerminalIcon className="h-4 w-4 mr-2" />
              Live Cluster
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Progress: {completedQuestions.size}/{questions.length}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Navigation Bar */}
        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`question-nav-button px-3 py-2 text-sm rounded-md border transition-all ${
                index === currentQuestionIndex
                  ? 'active bg-blue-600 text-white border-blue-600'
                  : completedQuestions.has(question.id)
                  ? 'completed bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span className="font-medium">{question.id}</span>
                {completedQuestions.has(question.id) && (
                  <CheckCircle className="h-3 w-3" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - Question Details */}
        <div className="question-panel w-1/2 flex flex-col border-r border-gray-200">
          {/* Question Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${getCategoryColor(currentQuestion.category)}`}>
                    {getCategoryIcon(currentQuestion.category)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {currentQuestion.id}: {currentQuestion.title}
                    </h2>
                    <p className="text-sm text-gray-600">{currentQuestion.category}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Badge>
                <Button
                  variant={completedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                  size="sm"
                  onClick={markCompleted}
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{completedQuestions.has(currentQuestion.id) ? 'Completed' : 'Mark Done'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Question Content Tabs */}
          <div className="flex-1 bg-white">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 m-0 rounded-none border-b">
                <TabsTrigger value="task" className="rounded-none">Task</TabsTrigger>
                <TabsTrigger value="environment" className="rounded-none">Environment</TabsTrigger>
                <TabsTrigger value="solution" className="rounded-none">Solution</TabsTrigger>
                <TabsTrigger value="tips" className="rounded-none">Tips</TabsTrigger>
              </TabsList>

              <div className="tab-content flex-1 overflow-auto">
                <TabsContent value="task" className="m-0 p-6 h-full">
                  <div className="question-content space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Task Description
                      </h3>
                      <div className="text-blue-800 whitespace-pre-line leading-relaxed">
                        {currentQuestion.task}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="environment" className="m-0 p-6 h-full">
                  <div className="question-content space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Environment Details
                      </h3>
                      <div className="text-green-800 whitespace-pre-line leading-relaxed">
                        {currentQuestion.environment}
                      </div>
                    </div>
                    
                    {currentQuestion.preparation && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold text-yellow-900 mb-3">Preparation Steps</h3>
                        <div className="text-yellow-800 whitespace-pre-line leading-relaxed">
                          {currentQuestion.preparation}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="solution" className="m-0 p-6 h-full">
                  <div className="code-block p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Step-by-Step Solution
                    </h3>
                    <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed">
                      {currentQuestion.steps}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="tips" className="m-0 p-6 h-full">
                  <div className="question-content space-y-4">
                    {currentQuestion.diagram && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <Network className="h-5 w-5" />
                          Architecture Diagram
                        </h3>
                        <div className="text-purple-800 whitespace-pre-line leading-relaxed font-mono text-xs">
                          {currentQuestion.diagram}
                        </div>
                      </div>
                    )}
                    
                    {currentQuestion.tips && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Exam Tips & Best Practices
                        </h3>
                        <div className="text-yellow-800 whitespace-pre-line leading-relaxed">
                          {currentQuestion.tips}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Terminal */}
        <div className="terminal-panel w-1/2 flex flex-col">
          {/* Terminal Header */}
          <div className="terminal-header bg-gray-800 text-white px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="font-medium">Terminal - ubuntu@master01</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="status-indicator w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Connected</span>
                </div>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {currentQuestion.id}
                </Badge>
              </div>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="terminal-window flex-1 bg-gray-900">
            {terminalSessionId && (
              <Terminal 
                sessionId={terminalSessionId}
                className="h-full"
                onCommand={(command) => {
                  console.log(`[${currentQuestion.id}] Command executed:`, command);
                }}
              />
            )}
          </div>

          {/* Terminal Footer */}
          <div className="bg-gray-800 text-gray-400 px-6 py-2 text-xs border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span>Session: {terminalSessionId.slice(-8)}</span>
              <span>Cluster: AWS K8s v1.28.15</span>
              <span>ssh-proxy.ciscloudlab.link:3001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPractice;
