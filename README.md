```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   HEADLESS CLAUDE SUBSCRIPTION                                  │
│                                                                 │
│   Run Claude Code on your VPS using your subscription.          │
│   Not the API.                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## The Problem

```
$ claude-code --api-key
  → Complex feature implementation
  → 45 minutes later...
  → Invoice: $47.82

$ claude-code --api-key
  → "Fix this bug"
  → 30 seconds later...
  → Invoice: $10.00
```

API pricing adds up fast. Developers report $20-100/day for moderate usage.
Heavy Opus users hit $1000+ days.

## The Solution

```
$ claude-code --subscription
  → Same Claude Code
  → Same capabilities
  → Fixed monthly cost
  → No token anxiety
```

**Claude Max ($200/mo) gives you what would cost $1000+ in API.**

Users report getting "thousands of dollars worth of API usage" monthly.

## Cost Comparison

```
┌────────────────────┬──────────┬─────────────────────────┐
│ Method             │ Cost/mo  │ Usage                   │
├────────────────────┼──────────┼─────────────────────────┤
│ API (Sonnet)       │ $100-200 │ Average dev usage       │
│ API (Opus heavy)   │ $500+    │ Complex projects        │
│ API (Opus intense) │ $1000+   │ Architecture work       │
├────────────────────┼──────────┼─────────────────────────┤
│ Max Subscription   │ $200     │ 20x Pro limits          │
│ Max Subscription   │ $100     │ 5x Pro limits           │
│ Pro Subscription   │ $20      │ Base limits             │
└────────────────────┴──────────┴─────────────────────────┘
```

This repo runs Claude Code headlessly on a VPS, using your subscription.
It works while you sleep.

## Quick Start

```bash
# On your VPS
git clone https://github.com/tolibear/headless-claude-subscription.git
cd headless-claude-subscription

# Run setup (detects Claude Code, guides auth, installs deps)
./setup.sh

# Start with a trigger
npm start triggers/file-trigger.ts      # Watch tasks.json
npm start triggers/webhook-trigger.ts   # HTTP endpoint
npm start triggers/github-issues-trigger.ts  # Auto-fix labeled issues
```

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│   Runner    │────▶│ Claude Code │
│             │     │             │     │             │
│ - file      │     │ - spawns    │     │ - implements│
│ - webhook   │     │ - streams   │     │ - commits   │
│ - github    │     │ - handles   │     │ - pushes    │
│ - custom    │     │   results   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    Your subscription
                    (not API tokens)
```

## Triggers

### File Trigger (simplest)

```bash
# tasks.json
[
  {"id": "1", "prompt": "Fix the login bug", "status": "pending"},
  {"id": "2", "prompt": "Add dark mode", "status": "pending"}
]

$ npm start triggers/file-trigger.ts
```

### Webhook Trigger

```bash
$ WEBHOOK_PORT=3000 npm start triggers/webhook-trigger.ts

# Submit tasks via HTTP
$ curl -X POST localhost:3000/task \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Add logout button"}'
```

### GitHub Issues Trigger

```bash
$ export GITHUB_TOKEN=ghp_xxx
$ export GITHUB_REPO=you/repo
$ export GITHUB_LABEL=claude-ready

$ npm start triggers/github-issues-trigger.ts

# Label an issue "claude-ready" → Claude fixes it → Comments results
```

## Run as Service

```bash
# Setup script offers systemd config, or manually:
sudo systemctl enable headless-claude
sudo systemctl start headless-claude
sudo journalctl -u headless-claude -f
```

## Config

```bash
# .env
PROJECT_DIR=/home/you/project
CLAUDE_TIMEOUT_MINUTES=30
POLL_INTERVAL_MS=10000
```

## Safety

- Git is your safety net (every change committed)
- CLAUDE.md defines guardrails (see examples/)
- 30min timeout per task (configurable)
- Secrets not passed to subprocess

## Use Cases

```
→ Issue triage bot      Label issues, Claude fixes them
→ PR reviewer           Auto-review on new PRs
→ Scheduled maintenance Linting, deps, cleanup
→ Webhook responder     React to external events
→ Feature implementer   Users vote, Claude builds
```

See [Evolving Site](https://github.com/tolibear/evolving-site) for a full example.

## Terms of Service

Your responsibility to comply with Anthropic's TOS.
We recommend human-triggered workflows over fully automated.

## License

MIT

---

Sources: [Anthropic Docs](https://code.claude.com/docs/en/costs), [User Reports](https://userjot.com/blog/claude-code-pricing-200-dollar-plan-worth-it), [Cost Analysis](https://www.aiengineering.report/p/the-hidden-costs-of-claude-code-token)
