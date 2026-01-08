# remote-ralph

Run Claude Code on a server so it works while you sleep.

## What This Does

Sets up Claude Code on a VPS as a background service. You give it tasks (via file, webhook, or GitHub issues), it implements them, commits, and pushes. Uses your Claude subscription, not API tokens.

## Prerequisites

- A VPS (any Linux server)
- Node.js 18+
- Claude Pro or Max subscription

## Setup

### 1. Clone on your VPS

```bash
ssh you@your-server
git clone https://github.com/tolibear/remote-ralph.git
cd remote-ralph
npm install
```

### 2. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### 3. Authenticate (the tricky part)

Claude Code needs a one-time browser auth. Since your VPS has no browser, you'll do a handoff:

```bash
# On your VPS, run:
claude

# It will show something like:
# "To authenticate, visit: https://console.anthropic.com/oauth/..."
# "Enter the code from the browser:"
```

1. Copy that URL
2. Open it in your local browser
3. Log in to your Claude account
4. You'll get a code - copy it
5. Paste the code back into your VPS terminal

Done. The session persists for weeks.

### 4. Configure

```bash
cp .env.example .env
# Edit .env with your settings
```

### 5. Pick a trigger and run

```bash
# File-based: watches tasks.json for new tasks
npm start triggers/file-trigger.ts

# Webhook: HTTP endpoint for external systems
npm start triggers/webhook-trigger.ts

# GitHub: auto-fixes issues labeled "claude-ready"
npm start triggers/github-issues-trigger.ts
```

### 6. Run as a service (optional)

```bash
sudo cp remote-ralph.service /etc/systemd/system/
sudo systemctl enable remote-ralph
sudo systemctl start remote-ralph

# View logs
sudo journalctl -u remote-ralph -f
```

## Triggers

**File trigger** — Drop tasks in `tasks.json`:
```json
[{"id": "1", "prompt": "Fix the login bug", "status": "pending"}]
```

**Webhook trigger** — POST to `localhost:3000/task`:
```bash
curl -X POST localhost:3000/task -d '{"prompt": "Add dark mode"}'
```

**GitHub trigger** — Label issues `claude-ready`, Claude handles them.

## Why subscription instead of API?

Cost. A heavy day of Claude Code via API can cost $50-100. That's $1,500-3,000/month. Claude Max is $200/month flat for the same thing.

## License

MIT
