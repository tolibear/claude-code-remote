# headless-claude-subscription

Run Claude Code on your VPS using your subscription — not the API.

## Why?

Opus 4.5 API pricing:
- $15 per million input tokens
- $75 per million output tokens

A heavy coding day can burn through $50-100 in API costs. That's **$1,500-3,000/month**.

Claude Max subscription: **$200/month flat**. Same Opus 4.5, unlimited anxiety-free usage.

This repo lets you run Claude Code headlessly on a VPS using that subscription.

## Setup

```bash
git clone https://github.com/tolibear/headless-claude-subscription.git
cd headless-claude-subscription
./setup.sh
```

The setup script will:
- Check if Claude Code is installed
- Guide you through authentication
- Configure it as a background service

## Usage

Pick a trigger and run:

```bash
npm start triggers/file-trigger.ts          # reads tasks from tasks.json
npm start triggers/webhook-trigger.ts       # HTTP endpoint for external systems
npm start triggers/github-issues-trigger.ts # auto-fixes labeled GitHub issues
```

## Triggers

**File trigger** — Add tasks to `tasks.json`, Claude picks them up:
```json
[{"id": "1", "prompt": "Fix the login bug", "status": "pending"}]
```

**Webhook trigger** — POST tasks to an HTTP endpoint:
```bash
curl -X POST localhost:3000/task -d '{"prompt": "Add dark mode"}'
```

**GitHub Issues trigger** — Label issues `claude-ready`, Claude fixes them automatically.

## Run as a service

```bash
sudo systemctl enable headless-claude
sudo systemctl start headless-claude
```

## Safety

- Every change is committed to git (easy rollback)
- Define guardrails in your project's CLAUDE.md
- 30 minute timeout per task

## License

MIT
