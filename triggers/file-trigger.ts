/**
 * File-based trigger
 *
 * Watches a tasks.json file for new tasks. Great for simple setups
 * where you manually add tasks or have another system write to the file.
 *
 * Usage:
 *   npm start triggers/file-trigger.ts
 *
 * Task file format (tasks.json):
 * [
 *   { "id": "task-1", "prompt": "Fix the login bug", "status": "pending" },
 *   { "id": "task-2", "prompt": "Add dark mode", "status": "pending" }
 * ]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { TriggerAdapter, Task, TaskResult } from '../src/types.js'

interface FileTask {
  id: string
  prompt: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: string
}

const TASKS_FILE = process.env.TASKS_FILE || 'tasks.json'

function getTasksPath(): string {
  return resolve(process.cwd(), TASKS_FILE)
}

function loadTasks(): FileTask[] {
  const path = getTasksPath()
  if (!existsSync(path)) {
    return []
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return []
  }
}

function saveTasks(tasks: FileTask[]): void {
  writeFileSync(getTasksPath(), JSON.stringify(tasks, null, 2))
}

const trigger: TriggerAdapter = {
  async getNextTask(): Promise<Task | null> {
    const tasks = loadTasks()
    const pending = tasks.find(t => t.status === 'pending')

    if (!pending) return null

    // Mark as in progress
    pending.status = 'in_progress'
    saveTasks(tasks)

    return {
      id: pending.id,
      prompt: pending.prompt,
    }
  },

  async onTaskComplete(result: TaskResult): Promise<void> {
    const tasks = loadTasks()
    const task = tasks.find(t => t.id === result.taskId)

    if (task) {
      task.status = result.success ? 'completed' : 'failed'
      task.result = result.aiNote
      saveTasks(tasks)
    }
  },

  async onStartup(): Promise<void> {
    const path = getTasksPath()
    if (!existsSync(path)) {
      // Create sample tasks file
      const sample: FileTask[] = [
        {
          id: 'example-1',
          prompt: 'Add a comment to the main function explaining what it does',
          status: 'pending',
        },
      ]
      saveTasks(sample)
      console.log(`Created sample tasks file: ${path}`)
      console.log('Edit this file to add your tasks, then restart.')
    }
  },
}

export default trigger
