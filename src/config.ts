import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import type { Config } from './types.js'

// Load environment variables
loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '.env.local') })

export function getConfig(): Config {
  return {
    projectDir: process.env.PROJECT_DIR || process.cwd(),
    claudePath: process.env.CLAUDE_PATH,
    timeoutMinutes: parseInt(process.env.CLAUDE_TIMEOUT_MINUTES || '30', 10),
  }
}

export function validateConfig(cfg: Config): string[] {
  const errors: string[] = []

  if (!existsSync(cfg.projectDir)) {
    errors.push(`PROJECT_DIR does not exist: ${cfg.projectDir}`)
  }

  if (cfg.claudePath && !existsSync(cfg.claudePath)) {
    errors.push(`CLAUDE_PATH does not exist: ${cfg.claudePath}`)
  }

  if (cfg.timeoutMinutes < 1 || cfg.timeoutMinutes > 120) {
    errors.push('CLAUDE_TIMEOUT_MINUTES must be between 1 and 120')
  }

  return errors
}

/**
 * Find the Claude Code binary
 */
export function getClaudePath(cfg: Config): string {
  // Check config first
  if (cfg.claudePath && existsSync(cfg.claudePath)) {
    return cfg.claudePath
  }

  // Common installation paths
  const commonPaths = [
    '/usr/local/bin/claude',
    '/usr/bin/claude',
    `${process.env.HOME}/.local/bin/claude`,
    `${process.env.HOME}/.claude/bin/claude`,
    `${process.env.HOME}/.nvm/versions/node/*/bin/claude`,
  ]

  for (const path of commonPaths) {
    if (existsSync(path)) {
      return path
    }
  }

  // Fallback - let the system find it
  return 'claude'
}
