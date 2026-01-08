// Headless Claude Types

export interface Config {
  projectDir: string
  claudePath?: string
  timeoutMinutes: number
}

export interface Task {
  id: string
  prompt: string
  metadata?: Record<string, unknown>
}

export interface TaskResult {
  taskId: string
  success: boolean
  status: 'completed' | 'failed' | 'denied' | 'needs_input'
  commitHash?: string
  aiNote: string
  error?: string
}

export interface TriggerAdapter {
  // Get the next task to process (return null if none)
  getNextTask(): Promise<Task | null>
  // Called when a task completes
  onTaskComplete(result: TaskResult): Promise<void>
  // Called when starting up
  onStartup?(): Promise<void>
  // Called when shutting down
  onShutdown?(): Promise<void>
}
