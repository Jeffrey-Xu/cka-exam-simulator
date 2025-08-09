import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function calculateScore(
  totalQuestions: number,
  correctAnswers: number,
  hintsUsed: number,
  timeBonus: number = 0
): number {
  const baseScore = (correctAnswers / totalQuestions) * 100
  const hintPenalty = hintsUsed * 2 // 2 points per hint
  const finalScore = Math.max(0, baseScore - hintPenalty + timeBonus)
  return Math.round(finalScore)
}

export function getDomainColor(domain: string): string {
  const colors: Record<string, string> = {
    'Storage': 'bg-blue-100 text-blue-800',
    'Services & Networking': 'bg-purple-100 text-purple-800',
    'Workloads & Scheduling': 'bg-orange-100 text-orange-800',
    'Troubleshooting & Maintenance': 'bg-red-100 text-red-800',
    'Cluster Architecture, Installation & Configuration': 'bg-green-100 text-green-800'
  }
  return colors[domain] || 'bg-gray-100 text-gray-800'
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    'easy': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'hard': 'bg-red-100 text-red-800'
  }
  return colors[difficulty] || 'bg-gray-100 text-gray-800'
}

export function validateKubectlCommand(command: string): boolean {
  const allowedCommands = [
    'get', 'describe', 'create', 'apply', 'delete', 'edit', 'patch',
    'logs', 'exec', 'port-forward', 'scale', 'rollout', 'config',
    'cluster-info', 'version', 'api-resources', 'api-versions',
    'explain', 'diff', 'kustomize', 'label', 'annotate', 'expose',
    'run', 'set', 'autoscale', 'drain', 'cordon', 'uncordon', 'taint'
  ]
  
  const cmd = command.trim().toLowerCase()
  if (!cmd.startsWith('kubectl ')) return false
  
  const subcommand = cmd.split(' ')[1]
  return allowedCommands.includes(subcommand)
}

export function sanitizeCommand(command: string): string {
  // Remove potentially dangerous characters and commands
  const dangerous = ['rm -rf', 'sudo', '&&', '||', ';', '|', '>', '<', '`', '$']
  let sanitized = command.trim()
  
  for (const danger of dangerous) {
    if (sanitized.includes(danger)) {
      throw new Error(`Dangerous command detected: ${danger}`)
    }
  }
  
  return sanitized
}

export function parseCommandOutput(output: string): {
  stdout: string
  stderr: string
  exitCode: number
} {
  // Simple output parser - can be enhanced
  return {
    stdout: output,
    stderr: '',
    exitCode: 0
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}