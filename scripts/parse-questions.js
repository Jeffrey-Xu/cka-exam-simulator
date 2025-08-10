const fs = require('fs');
const path = require('path');

// Question parser to extract all CKA questions from validated files
function parseQuestionFile(filePath, questionId) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract question title from filename
  const filename = path.basename(filePath);
  const titleMatch = filename.match(/Q\d+-(.+)/);
  const title = titleMatch ? titleMatch[1].replace(/([A-Z])/g, ' $1').trim() : filename;
  
  // Extract question content
  const questionMatch = content.match(/Question:\s*([\s\S]*?)(?:\n\nEnvironment Details:|Answer:)/);
  const question = questionMatch ? questionMatch[1].trim() : '';
  
  // Extract environment details
  const envMatch = content.match(/Environment Details:\s*([\s\S]*?)(?:\n\nPrepare|Answer:)/);
  const environment = envMatch ? envMatch[1].trim() : '';
  
  // Extract answer section
  const answerMatch = content.match(/Answer:\s*([\s\S]*?)$/);
  const answer = answerMatch ? answerMatch[1].trim() : '';
  
  // Determine domain based on question content and title
  const domain = getDomain(title, question);
  
  // Determine difficulty based on question complexity
  const difficulty = getDifficulty(question, answer);
  
  // Estimate time limit based on question complexity
  const timeLimit = getTimeLimit(question, answer);
  
  // Extract hints from question content
  const hints = extractHints(question, answer);
  
  // Extract validation criteria
  const validation = extractValidation(question, answer, title);
  
  return {
    id: questionId,
    title: title,
    domain: domain,
    difficulty: difficulty,
    timeLimit: timeLimit,
    description: question.split('\n')[0] || question.substring(0, 150) + '...',
    fullQuestion: question,
    environment: environment,
    answer: answer,
    hints: hints,
    validation: validation,
    status: 'not-started',
    attempts: 0
  };
}

function getDomain(title, question) {
  const titleLower = title.toLowerCase();
  const questionLower = question.toLowerCase();
  
  if (titleLower.includes('pvc') || titleLower.includes('storage') || questionLower.includes('persistent')) {
    return 'Storage';
  }
  if (titleLower.includes('service') || titleLower.includes('ingress') || titleLower.includes('network')) {
    return 'Services & Networking';
  }
  if (titleLower.includes('hpa') || titleLower.includes('priority') || titleLower.includes('sidecar') || titleLower.includes('resources')) {
    return 'Workloads & Scheduling';
  }
  if (titleLower.includes('etcd') || titleLower.includes('cri') || titleLower.includes('cluster')) {
    return 'Cluster Architecture';
  }
  if (titleLower.includes('crd') || titleLower.includes('argocd') || titleLower.includes('calico')) {
    return 'Troubleshooting';
  }
  
  return 'Services & Networking'; // Default
}

function getDifficulty(question, answer) {
  const complexity = question.length + answer.length;
  const steps = (answer.match(/\n\[.*?\]/g) || []).length;
  
  if (complexity > 3000 || steps > 15) return 5; // Expert
  if (complexity > 2000 || steps > 10) return 4; // Hard
  if (complexity > 1000 || steps > 6) return 3;  // Medium
  if (complexity > 500 || steps > 3) return 2;   // Easy
  return 1; // Basic
}

function getTimeLimit(question, answer) {
  const steps = (answer.match(/\n\[.*?\]/g) || []).length;
  const baseTime = 10;
  const timePerStep = 2;
  
  return Math.min(Math.max(baseTime + (steps * timePerStep), 10), 30);
}

function extractHints(question, answer) {
  const hints = [];
  
  // Basic hint - always available
  hints.push({
    id: `hint-basic-${Date.now()}`,
    level: 'basic',
    title: 'Getting Started',
    content: 'Start by checking the current state of resources with kubectl get commands',
    penaltyPoints: 5,
    unlocked: false
  });
  
  // Intermediate hint based on question type
  if (question.includes('PVC') || question.includes('storage')) {
    hints.push({
      id: `hint-intermediate-${Date.now()}`,
      level: 'intermediate',
      title: 'Storage Configuration',
      content: 'Check available storage classes and PVs before creating PVCs',
      penaltyPoints: 10,
      unlocked: false
    });
  } else if (question.includes('Service') || question.includes('NodePort')) {
    hints.push({
      id: `hint-intermediate-${Date.now()}`,
      level: 'intermediate',
      title: 'Service Configuration',
      content: 'Use kubectl expose or create a Service YAML with the correct selector',
      penaltyPoints: 10,
      unlocked: false
    });
  }
  
  // Advanced hint - command structure
  const commandMatch = answer.match(/kubectl\s+\w+.*$/m);
  if (commandMatch) {
    hints.push({
      id: `hint-advanced-${Date.now()}`,
      level: 'advanced',
      title: 'Command Structure',
      content: `Try using: ${commandMatch[0].split(' ').slice(0, 3).join(' ')}...`,
      penaltyPoints: 15,
      unlocked: false
    });
  }
  
  return hints;
}

function extractValidation(question, answer, title) {
  const validation = [];
  
  // Extract validation steps from answer
  const steps = answer.match(/\[.*?\]\s*\$\s*kubectl\s+get\s+.*$/gm) || [];
  
  steps.forEach((step, index) => {
    const commandMatch = step.match(/kubectl\s+get\s+(.+)$/);
    if (commandMatch) {
      validation.push({
        id: `validation-${index + 1}`,
        description: `Verify ${commandMatch[1]} is configured correctly`,
        command: `kubectl get ${commandMatch[1]}`,
        expectedOutput: 'Running',
        status: 'pending',
        points: 20 + (index * 10)
      });
    }
  });
  
  // Default validation if none found
  if (validation.length === 0) {
    validation.push({
      id: 'validation-default',
      description: 'Verify the solution is working correctly',
      command: 'kubectl get all',
      expectedOutput: 'All resources running',
      status: 'pending',
      points: 50
    });
  }
  
  return validation;
}

// Parse all questions
function parseAllQuestions() {
  const questionsDir = '/Users/jeffreyxu/Documents/Certs/CKA/Q&A/Q&A-Valid';
  const files = fs.readdirSync(questionsDir);
  const questions = [];
  
  files.forEach(file => {
    if (file.startsWith('Q') && !file.includes('.')) {
      const filePath = path.join(questionsDir, file);
      const questionId = file.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const question = parseQuestionFile(filePath, questionId);
      questions.push(question);
    }
  });
  
  return questions.sort((a, b) => {
    const aNum = parseInt(a.id.match(/\d+/)[0]);
    const bNum = parseInt(b.id.match(/\d+/)[0]);
    return aNum - bNum;
  });
}

// Generate the questions file
const questions = parseAllQuestions();

const output = `// Auto-generated from CKA validated questions
// Generated on: ${new Date().toISOString()}
// Total questions: ${questions.length}

export const ckaQuestions = ${JSON.stringify(questions, null, 2)};

export default ckaQuestions;
`;

// Write to the data directory
const outputPath = '/Users/jeffreyxu/Documents/Certs/CKA/CKA-Simulator/src/data/questions.ts';
fs.writeFileSync(outputPath, output);

console.log(`✅ Successfully parsed ${questions.length} CKA questions`);
console.log(`📝 Output written to: ${outputPath}`);
console.log(`📊 Questions by domain:`);

const domainCounts = questions.reduce((acc, q) => {
  acc[q.domain] = (acc[q.domain] || 0) + 1;
  return acc;
}, {});

Object.entries(domainCounts).forEach(([domain, count]) => {
  console.log(`   ${domain}: ${count} questions`);
});