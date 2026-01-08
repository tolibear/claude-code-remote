#!/usr/bin/env node

import { getConfig, validateConfig } from './config.js'
import { runTask, gitPull, gitPush, hasUnpushedCommits } from './runner.js'
import { printBanner, log, clearLine, printCountdown } from './ui.js'
import type { TriggerAdapter, Task, TaskResult } from './types.js'

// Parse command line arguments
const args = process.argv.slice(2)
const triggerPath = args[0]

if (!triggerPath) {
  console.error('Usage: npm start <trigger-file>')
  console.error('')
  console.error('Examples:')
  console.error('  npm start triggers/file-trigger.ts')
  console.error('  npm start triggers/webhook-trigger.ts')
  console.error('  npm start triggers/cron-trigger.ts')
  process.exit(1)
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sleepWithCountdown(ms: number): Promise<boolean> {
  const startTime = Date.now()
  const endTime = startTime + ms

  while (Date.now() < endTime) {
    if (!running) return false
    const remaining = endTime - Date.now()
    printCountdown(remaining)
    await sleep(1000)
  }
  clearLine()
  return true
}

let running = true

async function main(): Promise<void> {
  printBanner()

  // Load and validate configuration
  const config = getConfig()
  const errors = validateConfig(config)

  if (errors.length > 0) {
    errors.forEach((e) => log(e, 'error'))
    process.exit(1)
  }

  // Load the trigger adapter
  log(`Loading trigger: ${triggerPath}`, 'info')
  let trigger: TriggerAdapter

  try {
    const triggerModule = await import(`../${triggerPath}`)
    trigger = triggerModule.default || triggerModule.trigger
    if (!trigger || typeof trigger.getNextTask !== 'function') {
      throw new Error('Trigger must export a TriggerAdapter with getNextTask() method')
    }
  } catch (err) {
    log(`Failed to load trigger: ${err instanceof Error ? err.message : err}`, 'error')
    process.exit(1)
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nShutting down...', 'warn')
    running = false
  })

  process.on('SIGTERM', () => {
    log('\nReceived SIGTERM, shutting down...', 'warn')
    running = false
  })

  // Initialize trigger
  if (trigger.onStartup) {
    await trigger.onStartup()
  }

  log('Headless Claude is now running. Press Ctrl+C to stop.', 'success')

  // Check for unpushed commits from previous runs
  try {
    const unpushed = await hasUnpushedCommits(config.projectDir)
    if (unpushed) {
      log('Found unpushed commits from previous run, pushing...', 'warn')
      const pushSuccess = await gitPush(config.projectDir)
      if (pushSuccess) {
        log('Successfully pushed previous commits!', 'success')
      } else {
        log('Could not push previous commits - will retry later', 'warn')
      }
    }
  } catch (err) {
    log(`Error checking for unpushed commits: ${err}`, 'warn')
  }

  // Main loop
  const pollInterval = parseInt(process.env.POLL_INTERVAL_MS || '10000', 10)

  while (running) {
    try {
      // Get next task from trigger
      const task = await trigger.getNextTask()

      if (!task) {
        // No task available, wait and check again
        const shouldContinue = await sleepWithCountdown(pollInterval)
        if (!shouldContinue) break
        continue
      }

      log(`Found task: ${task.id}`, 'success')

      // Pull latest changes before starting
      try {
        await gitPull(config.projectDir)
      } catch (err) {
        log(`Git pull failed: ${err instanceof Error ? err.message : err}`, 'error')
        continue
      }

      // Run the task
      const result = await runTask(task, config)

      // If successful, try to push
      if (result.success) {
        const unpushed = await hasUnpushedCommits(config.projectDir)
        if (unpushed) {
          log('Pushing changes...', 'info')
          const pushSuccess = await gitPush(config.projectDir)
          if (!pushSuccess) {
            log('Push failed - will retry later', 'warn')
          }
        }
      }

      // Notify trigger of completion
      await trigger.onTaskComplete(result)

      if (result.success) {
        log(`Task ${task.id} completed successfully!`, 'success')
      } else {
        log(`Task ${task.id} finished with status: ${result.status}`, 'warn')
      }

      // Brief pause before next check
      const shouldContinue = await sleepWithCountdown(pollInterval)
      if (!shouldContinue) break

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      log(`Error: ${msg}`, 'error')

      // Wait before retrying
      const shouldContinue = await sleepWithCountdown(60000)
      if (!shouldContinue) break
    }
  }

  // Cleanup
  if (trigger.onShutdown) {
    await trigger.onShutdown()
  }

  log('Headless Claude stopped.', 'info')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
