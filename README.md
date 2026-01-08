# headless-claude-subscription

> Run Claude Code 24/7 on your VPS using your subscription — not the API.

Your Claude subscription ($20/mo) gives you **5-10x more usage** than equivalent API spend. This repo lets you run Claude Code autonomously on a VPS, triggered by webhooks, files, GitHub issues, or your own custom triggers.

## Why This Exists

| Approach | Monthly Cost | Usage |
|----------|-------------|-------|
| Claude API | $200-500+ | Limited by tokens |
| **Claude Subscription** | $20 | Much higher limits |

Claude Code CLI uses your subscription credits, not API tokens. Running it headlessly on a VPS means it works while you sleep.

## What It Does

1. Runs Claude Code on your VPS as a background service
2. Watches for tasks via triggers (file, webhook, GitHub issues, or custom)
3. Claude implements the task, commits, and pushes
4. Notifies you of the result

## Quick Start

### Prerequisites

- A VPS (AWS, DigitalOcean, Hetzner, or [Hostinger's Claude template](https://www.hostinger.com/vps/claude-code))
- Node.js 18+
- Git
- Claude Pro/Team subscription

### Setup (< 30 minutes)

```bash
# 1. Clone this repo to your VPS
git clone https://github.com/YOUR_USERNAME/headless-claude-subscription.git
cd headless-claude-subscription

# 2. Run the setup script
./setup.sh

# 3. The script will:
#    - Check for Claude Code CLI (install if needed)
#    - Guide you through authentication
#    - Install dependencies
#    - Optionally create a systemd service
```

### Authentication

Claude Code requires a one-time browser authentication:

```bash
# On your VPS, run:
claude

# It will display a URL. Open that URL in your browser,
# complete the auth, and paste the code back into the terminal.
```

### Run It

```bash
# Using the file trigger (simplest)
npm start triggers/file-trigger.ts

# Using the webhook trigger
npm start triggers/webhook-trigger.ts

# Using the GitHub issues trigger
npm start triggers/github-issues-trigger.ts
```

## Triggers

### File Trigger

The simplest trigger. Watches a `tasks.json` file for tasks.

```json
// tasks.json
[
  { "id": "task-1", "prompt": "Fix the login bug in auth.ts", "status": "pending" },
  { "id": "task-2", "prompt": "Add dark mode support", "status": "pending" }
]
```

```bash
npm start triggers/file-trigger.ts
```

### Webhook Trigger

Exposes an HTTP endpoint for external systems to submit tasks.

```bash
# Start the webhook server
WEBHOOK_PORT=3000 WEBHOOK_SECRET=mysecret npm start triggers/webhook-trigger.ts

# Submit a task
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: mysecret" \
  -d '{"id": "task-1", "prompt": "Add a logout button to the header"}'

# Check status
curl http://localhost:3000/status
```

### GitHub Issues Trigger

Automatically processes GitHub issues with a specific label.

```bash
# Set your GitHub token and repo
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export GITHUB_REPO=your-username/your-repo
export GITHUB_LABEL=claude-ready

npm start triggers/github-issues-trigger.ts
```

When an issue has the `claude-ready` label:
1. Claude reads the issue and implements a fix
2. Commits with "Fix #123: description"
3. Comments on the issue with results
4. Removes the label

### Custom Triggers

Create your own trigger by implementing the `TriggerAdapter` interface:

```typescript
// triggers/my-trigger.ts
import type { TriggerAdapter, Task, TaskResult } from '../src/types.js'

const trigger: TriggerAdapter = {
  async getNextTask(): Promise<Task | null> {
    // Return a task or null if none available
    return {
      id: 'unique-id',
      prompt: 'What Claude should do...',
    }
  },

  async onTaskComplete(result: TaskResult): Promise<void> {
    // Handle the completed task
    console.log(`Task ${result.taskId}: ${result.status}`)
  },
}

export default trigger
```

## Configuration

Create a `.env` file (the setup script does this for you):

```bash
# Directory containing your project
PROJECT_DIR=/home/user/my-project

# Claude binary path (auto-detected)
CLAUDE_PATH=/usr/local/bin/claude

# Task timeout in minutes
CLAUDE_TIMEOUT_MINUTES=30

# Poll interval in milliseconds
POLL_INTERVAL_MS=10000

# Webhook settings
WEBHOOK_PORT=3000
WEBHOOK_SECRET=your-secret

# GitHub settings
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=owner/repo
GITHUB_LABEL=claude-ready
```

## Running as a Service

The setup script can configure systemd for you. Manual setup:

```bash
# Create service file
sudo nano /etc/systemd/system/headless-claude.service
```

```ini
[Unit]
Description=Headless Claude
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/headless-claude-subscription
ExecStart=/usr/bin/npx tsx src/index.ts triggers/file-trigger.ts
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable headless-claude
sudo systemctl start headless-claude

# View logs
sudo journalctl -u headless-claude -f
```

## Safety & Guardrails

Claude operates within the guardrails you define in your project's `CLAUDE.md` file. See `examples/CLAUDE.md` for a template.

Key safety features:
- **Git is your safety net** — Every change is committed; revert if needed
- **CLAUDE.md guardrails** — Define what Claude can/cannot do
- **Timeout protection** — Tasks auto-terminate after 30 minutes (configurable)
- **Safe environment** — Secrets are not passed to Claude subprocess

## Use Cases

- **Issue Triage Bot** — Label issues `claude-ready`, let Claude fix them
- **PR Reviewer** — Trigger on new PRs, get AI code review
- **Scheduled Maintenance** — Run linting, dependency updates, etc.
- **Webhook Responder** — React to Stripe webhooks, form submissions
- **Feature Suggestion Implementer** — Users vote, Claude builds (see [Evolving Site](https://github.com/your-username/evolving-site))

## Terms of Service

This tool runs Claude Code using your Claude subscription. **You are responsible for ensuring your usage complies with [Anthropic's Terms of Service](https://www.anthropic.com/legal/consumer-terms).**

We recommend:
- Using human-triggered workflows rather than fully automated systems
- Reviewing Claude's output before deploying to production
- Keeping a human in the loop for important decisions

## Troubleshooting

### Claude authentication expires
Re-run `claude` to re-authenticate. Sessions typically last weeks.

### "Claude not found"
Ensure Claude Code is installed: `npm install -g @anthropic-ai/claude-code`

### Tasks stuck in progress
Check logs: `journalctl -u headless-claude -f`
The task may have timed out. Increase `CLAUDE_TIMEOUT_MINUTES` if needed.

### Git push fails
Ensure your VPS has SSH keys configured for your Git remote.

## Examples

See [Evolving Site](https://github.com/your-username/evolving-site) for a full implementation where users submit feature suggestions, vote on them, and Claude implements the winners.

## Contributing

PRs welcome! Especially:
- New trigger implementations
- Better error handling
- Documentation improvements

## License

MIT — use it however you want.
