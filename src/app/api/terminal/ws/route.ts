import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

// SSH configuration
const SSH_CONFIG = {
  host: process.env.K8S_MASTER_IP || '100.27.28.215',
  username: 'ubuntu',
  privateKey: process.env.SSH_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEArK3Y4ApkItytbaVvfYnP2G8Sro+cDAdSX9jTFdK1iL3hB0YQ
lM2KoPnPhHUOTI6ufCqo+aRA4biHkr4p3k6SCbJofu57l/2orMBVB6rsBGYAy5t3
2fbt5spy6ZNaursYFXH1qkq8SarjGo14/aNlZ0Nm80E8ZCn6PZYsPc9c/J73Iq2q
YfZTzh1WTC4o8+62b3ZA7xSN4680DhyZrYajOqX1fJbzI3tJA2DU20oaNh03rAWC
HzUnBDQYhyIqCLarHHU4G96txjFwRbtctHfQp7PAtdtuEbgzcmMdRqDIm31OZSz2
Zl95tDazuF70xSFbvECVVcMC2zlMRFcvR7e/HQIDAQABAoIBAHaeGVuVZ8IW6z9l
pFeNQmx/qEqnNd+BbBGRJTdZfgBHxvuzIpLFOtRnpihsLH1kifGbcGXEchlcJC0m
WiZuvJzSpDuFYPtAcQzyNbbFr8k5tJQo4MSmfjfKm/NdmLaq7NlWZhYrrnnAXK8R
vaomAvNTdrXk+zInL9H8hbmT52FURLwG/SCZVlICHKwbNk5G5P4EQBDX7UlHLESd
F/hyv26/ASi2x0Ibgr8lBrnchwycst/Hw4//sZQKhOOUqWgNIKd0BMpjnVFYwX8t
jkaRN9irLp0Az1LdFq5WodypA/qEdl1wGiGxoS2E+teSkUzvG5C1R+s8bp4mtoHG
s1V0VwECgYEA08heesp+4N+Am/ePEVcZdxmI/r594SKhgeAMTJ6kfHJ+L9gSqWes
ciA6/fK7WgdImfoLtGVV1KNqY4pKj/PtUwYqUbds//+NU31B88jI+etHUi7EQxG3
aHlH62r2nPsujd+C1tEruGwwPar1ojtyUOF45vXUJ2vCL8FPNgQLFMECgYEA0Ltr
RroFT2sB4vh74/n+W/NYLl29RK3I+jY+lfBTaPJwBmy6Gufyov0aK+qXiW7A92cM
CFUVZaJQEVXt5JqwWojfGY6baG3v5yAzDGDGvJzqIUUf9RmCpXrI6P7UpolfG2d2
AONo6EdHh5G+un7PElD674KxSldjBeB4aAN1dV0CgYEA0BbOjoQtCrNQ4O7ryjP0
t4uFihiOAwpN+xizvQ0bvZOZ3VTHcWCGllSI4kEASUNi2LhRi90N6rLutAOLo8of
ZDZomoZKOXdV27T1ep3Mq5O8Lkn5WZUsyyBvxCcDTdeYNJprKru346uZ8t3qII+c
kVAZxYXCAUHmOZoNRJvQb4ECgYAL0B+RICP+y6KOsttoGpTfpVT/QsTcZy1xo7JF
EBXYYagfZPXfYfMkcEiT5bHv0DnRhp5ytkYAu3/mi0NsZajHZumha6W18krafMMG
109IC2VgvqXBXFE9hkZqkUl9p1afmWpfQH+GbcpJjOELcvPLKJQbC/12pJ1xDrQh
xthV7QKBgQC/C38s8LRRTfbAuO3dpq7WMt43m2fNL/M3DQDLtFNyAObyUW6mxZ7o
vJeOfls9qutjpKanQbN/lNCmuRKD7RwOXvABctPyBpnby3I1YLSFIpduR9xDI5lD
YEeFwczEVTgAj35dQecrwpNxx14q7ms4p/UOeMTeSOwWLFLWsLLBdg==
-----END RSA PRIVATE KEY-----`
}

function createTempKeyFile(): string {
  const tempKeyPath = join(tmpdir(), `ssh-key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pem`)
  writeFileSync(tempKeyPath, SSH_CONFIG.privateKey, { mode: 0o600 })
  return tempKeyPath
}

async function executeKubectlCommand(command: string): Promise<{ output: string; error?: string; exitCode: number }> {
  let tempKeyPath: string | null = null
  
  try {
    // Create temporary key file
    tempKeyPath = createTempKeyFile()

    // Build SSH command
    const sshCommand = [
      'ssh',
      '-i', tempKeyPath,
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ConnectTimeout=10',
      `${SSH_CONFIG.username}@${SSH_CONFIG.host}`,
      `'cd /home/ubuntu && KUBECONFIG=/home/ubuntu/.kube/config ${command}'`
    ].join(' ')

    // Execute command
    const result = await execAsync(sshCommand, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 // 1MB buffer
    })

    return {
      output: result.stdout || result.stderr || '',
      exitCode: 0
    }

  } catch (error: any) {
    return {
      output: '',
      error: error.stderr || error.message || 'Command execution failed',
      exitCode: error.code || 1
    }
  } finally {
    // Clean up temporary key file
    if (tempKeyPath) {
      try {
        unlinkSync(tempKeyPath)
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp key file:', cleanupError)
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { command, sessionId } = await request.json()

    if (!command || typeof command !== 'string') {
      return Response.json({ error: 'Invalid command' }, { status: 400 })
    }

    // Validate kubectl command
    const sanitizedCommand = command.trim().toLowerCase()
    if (!sanitizedCommand.startsWith('kubectl ')) {
      return Response.json({ error: 'Only kubectl commands are allowed' }, { status: 403 })
    }

    // Execute command
    const result = await executeKubectlCommand(command)

    return Response.json({
      type: 'output',
      data: result.output,
      error: result.error,
      exitCode: result.exitCode,
      sessionId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Terminal API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}