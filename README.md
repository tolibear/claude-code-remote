# remote-ralph

Run Claude Code on a remote server using your subscription (not API).

## Why

Your Claude subscription works while your laptop is open. This makes it work while you sleep.

## How It Works

Your local Claude Code helps set up Claude Code on a remote server. Once authenticated, the remote Claude can run tasks autonomously - triggered by cron, webhooks, SSH, or whatever you want.

## Setup (with Local Claude)

Have your local Claude Code run these steps on your VPS:

### 1. SSH into your server

```bash
ssh user@your-server
```

### 2. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### 3. Authenticate

This is the handoff. Run `claude` on the server:

```bash
claude
```

It outputs an auth URL. Copy it, open in your browser, log in, get a code, paste it back into the server terminal.

Session lasts weeks.

### 4. Clone your project

```bash
git clone https://github.com/you/your-project.git
cd your-project
```

### 5. Run Claude

```bash
claude -p "your task here"
```

Or with a CLAUDE.md that defines what it should do:

```bash
claude
```

## CLAUDE.md

Your project's CLAUDE.md tells Claude what to do. Example:

```markdown
# CLAUDE.md

You are maintaining this project. When triggered:
1. Check for open issues labeled "ready"
2. Pick the highest priority one
3. Implement it
4. Run tests
5. Commit and push
```

## Triggering

Once set up, trigger however you want:

**Cron** — Run every hour:
```bash
0 * * * * cd /home/you/project && claude -p "check for work"
```

**Webhook** — Call from external system:
```bash
curl -X POST your-server/trigger
```

**SSH** — Run manually or from another Claude:
```bash
ssh server "cd project && claude -p 'fix the bug'"
```

**Systemd** — Run as a service that watches for tasks.

The trigger mechanism is up to you. This repo is just the setup guide.

## Cost

Claude Max: $200/month flat.
Equivalent API usage: $1,500-3,000/month.

## License

MIT
