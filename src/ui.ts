// Terminal UI utilities

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
}

export function printBanner(): void {
  console.log(`
${colors.cyan}${colors.bright}
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗     ███████╗███████╗   ║
  ║   ██║  ██║██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝   ║
  ║   ███████║█████╗  ███████║██║  ██║██║     █████╗  ███████╗   ║
  ║   ██╔══██║██╔══╝  ██╔══██║██║  ██║██║     ██╔══╝  ╚════██║   ║
  ║   ██║  ██║███████╗██║  ██║██████╔╝███████╗███████╗███████║   ║
  ║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝   ║
  ║                                                               ║
  ║        Claude Code on Your VPS - Subscription Powered         ║
  ╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`)
}

export function log(
  msg: string,
  level: 'info' | 'success' | 'warn' | 'error' = 'info'
): void {
  const timestamp = new Date().toISOString().slice(11, 19)
  const prefixes = {
    info: `${colors.dim}[${timestamp}]${colors.reset}`,
    success: `${colors.green}[${timestamp}] ✓${colors.reset}`,
    warn: `${colors.yellow}[${timestamp}] ⚠${colors.reset}`,
    error: `${colors.red}[${timestamp}] ✗${colors.reset}`,
  }
  console.log(`${prefixes[level]} ${msg}`)
}

export function printTask(taskId: string, prompt: string): void {
  const truncated = prompt.length > 60 ? prompt.slice(0, 57) + '...' : prompt
  console.log(`
${colors.bright}${colors.blue}═══ TASK: ${taskId} ═══${colors.reset}
${colors.cyan}${truncated}${colors.reset}
`)
}

export function printResult(success: boolean, aiNote: string): void {
  if (success) {
    console.log(`
${colors.green}${colors.bright}═══ SUCCESS ═══${colors.reset}
${colors.dim}${aiNote}${colors.reset}
`)
  } else {
    console.log(`
${colors.yellow}${colors.bright}═══ COMPLETED ═══${colors.reset}
${colors.dim}${aiNote}${colors.reset}
`)
  }
}

export function clearLine(): void {
  process.stdout.write('\r\x1b[K')
}

export function printCountdown(remaining: number): void {
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  process.stdout.write(`\r  ${colors.dim}Next check in: ${mins}m ${secs}s${colors.reset}   `)
}

// Format tool use events for display
export function formatToolUse(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case 'Read':
      return `${colors.cyan}📖 Reading${colors.reset} ${colors.dim}${input.file_path}${colors.reset}`
    case 'Edit':
      return `${colors.yellow}✏️  Editing${colors.reset} ${colors.dim}${input.file_path}${colors.reset}`
    case 'Write':
      return `${colors.green}📝 Writing${colors.reset} ${colors.dim}${input.file_path}${colors.reset}`
    case 'Bash':
      const cmd = String(input.command || '').slice(0, 80)
      return `${colors.magenta}$ ${colors.reset}${colors.dim}${cmd}${cmd.length >= 80 ? '...' : ''}${colors.reset}`
    case 'Glob':
      return `${colors.blue}🔍 Searching${colors.reset} ${colors.dim}${input.pattern}${colors.reset}`
    case 'Grep':
      return `${colors.blue}🔎 Grep${colors.reset} ${colors.dim}${input.pattern}${colors.reset}`
    case 'Task':
      return `${colors.cyan}🤖 Agent${colors.reset} ${colors.dim}${input.description || 'task'}${colors.reset}`
    case 'TodoWrite':
      return `${colors.yellow}📋 Todos${colors.reset} ${colors.dim}updated${colors.reset}`
    default:
      return `${colors.gray}🔧 ${toolName}${colors.reset}`
  }
}
