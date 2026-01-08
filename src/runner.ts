import { spawn } from 'child_process'
import { getClaudePath } from './config.js'
import { log, printTask, printResult, formatToolUse } from './ui.js'
import type { Config, Task, TaskResult } from './types.js'

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
}

/**
 * Get a safe subset of environment variables for Claude subprocess
 * Explicitly excludes secrets to prevent accidental exposure
 */
function getSafeEnvironment(): Record<string, string | undefined> {
  const safeEnv: Record<string, string | undefined> = {}

  const allowedVars = [
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'TERM',
    'LANG',
    'LC_ALL',
    'NODE_ENV',
    'CLAUDE_PATH',
    'TMPDIR',
    'TMP',
    'TEMP',
  ]

  for (const key of allowedVars) {
    if (process.env[key]) {
      safeEnv[key] = process.env[key]
    }
  }

  return safeEnv
}

/**
 * Sanitize terminal output to prevent secret leakage
 */
function sanitizeOutput(output: string): string {
  return output
    // Redact JWT tokens
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]')
    // Redact long hex strings (likely tokens)
    .replace(/[A-Fa-f0-9]{40,}/g, '[TOKEN_REDACTED]')
    // Redact common secret patterns
    .replace(/(?:api[_-]?key|secret|token|password|auth)[\s]*[=:]\s*['"]?[^\s'"]+['"]?/gi, '[SECRET_REDACTED]')
}

/**
 * Run Claude Code with a prompt and return the result
 */
export async function runTask(task: Task, config: Config): Promise<TaskResult> {
  printTask(task.id, task.prompt)
  log(`Starting task: ${task.id}`, 'info')

  try {
    const result = await runClaude(task.prompt, config)

    if (result.success) {
      const commitHash = await getLatestCommitHash(config.projectDir)
      printResult(true, result.aiNote || 'Task completed successfully')

      return {
        taskId: task.id,
        success: true,
        status: 'completed',
        commitHash,
        aiNote: result.aiNote || 'Task completed successfully',
      }
    } else {
      printResult(false, result.aiNote || result.error || 'Task failed')

      let status: 'failed' | 'denied' | 'needs_input' = 'failed'
      if (result.denied) status = 'denied'
      else if (result.needsInput) status = 'needs_input'

      return {
        taskId: task.id,
        success: false,
        status,
        aiNote: result.aiNote || result.error || 'Task failed',
        error: result.error,
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log(`Task error: ${errorMsg}`, 'error')
    printResult(false, `Error: ${errorMsg}`)

    return {
      taskId: task.id,
      success: false,
      status: 'failed',
      aiNote: `Error during task: ${errorMsg}`,
      error: errorMsg,
    }
  }
}

async function runClaude(
  prompt: string,
  config: Config
): Promise<{
  success: boolean
  denied?: boolean
  needsInput?: boolean
  aiNote?: string
  error?: string
}> {
  return new Promise((resolve) => {
    const claudePath = getClaudePath(config)
    log(`Using Claude binary: ${claudePath}`, 'info')

    const timeoutMs = config.timeoutMinutes * 60 * 1000

    // Spawn Claude Code with streaming JSON output
    const claude = spawn(claudePath, [
      '-p',
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
    ], {
      cwd: config.projectDir,
      env: getSafeEnvironment() as NodeJS.ProcessEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Set up timeout
    const timeoutId = setTimeout(() => {
      log(`Claude process timed out after ${config.timeoutMinutes} minutes`, 'error')
      claude.kill('SIGTERM')
      setTimeout(() => {
        if (!claude.killed) claude.kill('SIGKILL')
      }, 10000)
    }, timeoutMs)

    // Send prompt via stdin
    claude.stdin?.write(prompt)
    claude.stdin?.end()

    let fullOutput = ''
    let resultData: { success?: boolean; denied?: boolean; needsInput?: boolean; aiNote?: string } | null = null
    let lineBuffer = ''

    claude.stdout?.on('data', (data: Buffer) => {
      lineBuffer += data.toString()

      const lines = lineBuffer.split('\n')
      lineBuffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          const event = JSON.parse(line)
          processStreamEvent(event)
        } catch {
          // Not valid JSON, skip
        }
      }
    })

    function processStreamEvent(event: Record<string, unknown>) {
      const type = event.type as string

      switch (type) {
        case 'system':
          process.stdout.write(`${colors.green}✓ Claude Code started${colors.reset}\n`)
          break

        case 'assistant': {
          const msg = event.message as Record<string, unknown>
          if (msg?.content && Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if ((block as Record<string, unknown>).type === 'tool_use') {
                const toolUse = block as { name: string; input: Record<string, unknown> }
                process.stdout.write(formatToolUse(toolUse.name, toolUse.input) + '\n')
              }
            }
          }
          break
        }

        case 'stream_event': {
          const streamEvent = event.event as Record<string, unknown>
          if (!streamEvent) break

          const eventType = streamEvent.type as string

          if (eventType === 'content_block_delta') {
            const delta = streamEvent.delta as Record<string, unknown>
            if (delta?.type === 'text_delta' && delta.text) {
              const text = delta.text as string
              fullOutput += text
              process.stdout.write(sanitizeOutput(text))
            }
          } else if (eventType === 'content_block_start') {
            const contentBlock = streamEvent.content_block as Record<string, unknown>
            if (contentBlock?.type === 'tool_use') {
              const toolName = contentBlock.name as string
              process.stdout.write(`\n${colors.dim}▶ ${toolName}...${colors.reset}\n`)
            }
          }
          break
        }

        case 'tool_use': {
          const toolEvent = event as { tool: string; input: Record<string, unknown> }
          if (toolEvent.tool) {
            process.stdout.write(formatToolUse(toolEvent.tool, toolEvent.input || {}) + '\n')
          }
          break
        }

        case 'tool_result':
          process.stdout.write(`${colors.dim}  └─ done${colors.reset}\n`)
          break

        case 'result': {
          const result = event.result as string
          if (result) {
            fullOutput = result
            const jsonMatch = result.match(/\{"success":\s*(true|false)[^}]*\}/)
            if (jsonMatch) {
              try {
                resultData = JSON.parse(jsonMatch[0])
              } catch {
                // Ignore parse errors
              }
            }
          }
          break
        }
      }
    }

    claude.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(sanitizeOutput(data.toString()))
    })

    claude.on('close', (exitCode) => {
      clearTimeout(timeoutId)

      // Process remaining buffer
      if (lineBuffer.trim()) {
        try {
          const event = JSON.parse(lineBuffer)
          processStreamEvent(event)
        } catch {
          // Ignore
        }
      }

      console.log()
      log('Claude Code finished', 'info')

      // Use parsed result if available
      if (resultData) {
        resolve({
          success: resultData.success ?? false,
          denied: resultData.denied,
          needsInput: resultData.needsInput,
          aiNote: resultData.aiNote,
        })
        return
      }

      // Try to parse JSON from full output
      const jsonMatch = fullOutput.match(/\{"success":\s*(true|false)[^}]*\}/)
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0])
          resolve({
            success: result.success,
            denied: result.denied,
            needsInput: result.needsInput,
            aiNote: result.aiNote,
          })
          return
        } catch {
          // Fall through
        }
      }

      if (exitCode !== 0) {
        resolve({
          success: false,
          error: `Claude exited with code ${exitCode}`,
        })
        return
      }

      resolve({
        success: true,
        aiNote: 'Task completed',
      })
    })

    claude.on('error', (err) => {
      clearTimeout(timeoutId)
      log(`Failed to spawn Claude: ${err.message}`, 'error')
      resolve({
        success: false,
        error: `Failed to spawn Claude: ${err.message}`,
      })
    })
  })
}

async function getLatestCommitHash(cwd: string): Promise<string> {
  return new Promise((resolve) => {
    const git = spawn('git', ['rev-parse', '--short', 'HEAD'], { cwd })
    let hash = ''
    git.stdout.on('data', (data: Buffer) => {
      hash += data.toString().trim()
    })
    git.on('close', () => resolve(hash || 'unknown'))
    git.on('error', () => resolve('unknown'))
  })
}

/**
 * Git utilities
 */
export async function gitPull(cwd: string): Promise<void> {
  log('Pulling latest changes...', 'info')

  const result = await runGitCommand(['pull', '--rebase', 'origin', 'HEAD'], cwd)
  if (result.code !== 0) {
    log('Git pull failed, attempting recovery...', 'warn')
    await runGitCommand(['rebase', '--abort'], cwd)
    await runGitCommand(['fetch', 'origin'], cwd)
    await runGitCommand(['reset', '--hard', 'origin/HEAD'], cwd)
  } else {
    log('Git pull successful', 'success')
  }
}

export async function gitPush(cwd: string): Promise<boolean> {
  log('Pushing changes...', 'info')

  const result = await runGitCommand(['push'], cwd)
  if (result.code === 0) {
    log('Git push successful', 'success')
    return true
  }

  log('Git push failed', 'error')
  return false
}

export async function hasUnpushedCommits(cwd: string): Promise<boolean> {
  const result = await runGitCommand(['log', '@{u}..HEAD', '--oneline'], cwd)
  return result.stdout.trim().length > 0
}

async function runGitCommand(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const git = spawn('git', args, { cwd, stdio: ['inherit', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    git.stdout?.on('data', (data: Buffer) => { stdout += data.toString() })
    git.stderr?.on('data', (data: Buffer) => { stderr += data.toString() })
    git.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
    git.on('error', (err) => resolve({ code: 1, stdout: '', stderr: err.message }))
  })
}
