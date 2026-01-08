/**
 * Webhook trigger
 *
 * Starts an HTTP server that accepts task requests via POST.
 * Great for integrating with GitHub Actions, CI/CD, or other systems.
 *
 * Usage:
 *   npm start triggers/webhook-trigger.ts
 *
 * Environment variables:
 *   WEBHOOK_PORT=3000       Port to listen on (default: 3000)
 *   WEBHOOK_SECRET=xxx      Optional secret for authentication
 *
 * POST /task
 * Headers: x-webhook-secret: <secret>
 * Body: { "id": "task-1", "prompt": "Fix the login bug" }
 *
 * GET /status
 * Returns current status and task queue
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import type { TriggerAdapter, Task, TaskResult } from '../src/types.js'

const PORT = parseInt(process.env.WEBHOOK_PORT || '3000', 10)
const SECRET = process.env.WEBHOOK_SECRET

interface QueuedTask {
  task: Task
  addedAt: Date
}

interface CompletedTask {
  taskId: string
  result: TaskResult
  completedAt: Date
}

const taskQueue: QueuedTask[] = []
const completedTasks: CompletedTask[] = []
let currentTask: Task | null = null
let server: ReturnType<typeof createServer> | null = null

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Check authentication if secret is configured
  if (SECRET && req.headers['x-webhook-secret'] !== SECRET) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  // POST /task - Add a new task
  if (req.method === 'POST' && url.pathname === '/task') {
    try {
      const body = await parseBody(req) as { id?: string; prompt?: string }

      if (!body.prompt) {
        sendJson(res, 400, { error: 'Missing prompt' })
        return
      }

      const task: Task = {
        id: body.id || `task-${Date.now()}`,
        prompt: body.prompt,
      }

      taskQueue.push({ task, addedAt: new Date() })
      console.log(`[Webhook] Task queued: ${task.id}`)

      sendJson(res, 200, {
        success: true,
        taskId: task.id,
        queuePosition: taskQueue.length,
      })
    } catch (err) {
      sendJson(res, 400, { error: String(err) })
    }
    return
  }

  // GET /status - Get current status
  if (req.method === 'GET' && url.pathname === '/status') {
    sendJson(res, 200, {
      currentTask: currentTask?.id || null,
      queueLength: taskQueue.length,
      queue: taskQueue.map(q => ({ id: q.task.id, addedAt: q.addedAt })),
      recentCompleted: completedTasks.slice(-10),
    })
    return
  }

  // GET /health - Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' })
    return
  }

  sendJson(res, 404, { error: 'Not found' })
}

const trigger: TriggerAdapter = {
  async getNextTask(): Promise<Task | null> {
    const queued = taskQueue.shift()
    if (!queued) {
      currentTask = null
      return null
    }

    currentTask = queued.task
    return queued.task
  },

  async onTaskComplete(result: TaskResult): Promise<void> {
    completedTasks.push({
      taskId: result.taskId,
      result,
      completedAt: new Date(),
    })

    // Keep only last 100 completed tasks
    if (completedTasks.length > 100) {
      completedTasks.shift()
    }

    currentTask = null
    console.log(`[Webhook] Task completed: ${result.taskId} (${result.status})`)
  },

  async onStartup(): Promise<void> {
    server = createServer((req, res) => {
      handleRequest(req, res).catch(err => {
        console.error('[Webhook] Error:', err)
        sendJson(res, 500, { error: 'Internal error' })
      })
    })

    server.listen(PORT, () => {
      console.log(`[Webhook] Server listening on port ${PORT}`)
      console.log(`[Webhook] POST http://localhost:${PORT}/task to add tasks`)
      console.log(`[Webhook] GET http://localhost:${PORT}/status for status`)
    })
  },

  async onShutdown(): Promise<void> {
    if (server) {
      server.close()
      console.log('[Webhook] Server stopped')
    }
  },
}

export default trigger
