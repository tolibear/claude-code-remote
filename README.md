# Claude Code Remote (not API) + Triggers 

Run Claude Code on a remote server using your subscription (not API).

## Why

**Cost:**
- Claude Max (Opus 4.5): **$200/month** flat
- Equivalent API usage: **$1,500-3,000/month**

Opus 4.5 API pricing is $15/million input tokens and $75/million output tokens. A heavy coding day burns $50-100. That's $1,500-3,000/month if you're using Claude Code daily.

With Max subscription, you get the same Opus 4.5 for $200/month. This repo helps you run it on a server so it works while you sleep.

## Example: Evolving Site

[Evolving Site](https://evolving-site.vercel.app/) is a website where users submit feature suggestions and vote on them. A remote Claude runs on a VPS and implements the top-voted suggestions automatically.

Users vote → Claude implements → Site deploys.

That's this repo in action.

## What You Do

1. Give Claude the prompt below
2. Click one auth link when asked
3. Done

## The Prompt

Copy this and give it to your local Claude Code:

```
I want to set up Claude Code on a remote server so it can run while I'm away.

I'm a beginner - walk me through everything:

1. FIRST, help me get a VPS if I don't have one:
   - Recommend the cheapest option (Hostinger, DigitalOcean, AWS)
   - Walk me through creating an account and server
   - Help me set up SSH access

2. THEN, set up Claude Code on the server:
   - SSH into the server
   - Install Node.js if needed
   - Install Claude Code (npm install -g @anthropic-ai/claude-code)
   - Run `claude` to start auth
   - Give me the auth URL - I'll click it and give you the code back
   - Complete the authentication

3. FINALLY, update remote-logs.sh with my server details so I can stream logs locally.

Ask me questions as we go. I'll tell you my server details once I have them, or help me get them.
```

## After Setup

### Stream Logs

```bash
./remote-logs.sh
```

(Claude will configure this during setup)

### Run Tasks

**Manually:**
```bash
ssh server "cd /project && claude -p 'fix the bug'"
```

**From local Claude:**
```
SSH into my server and tell Claude to fix the login bug.
```

## Triggers

See the `triggers/` folder for prompts to set up:

- **cron.md** — Run Claude on a schedule
- **webhook.md** — HTTP endpoint that triggers Claude
- **github-issues.md** — Auto-fix issues with a label
- **file-watch.md** — Watch a tasks.json file
- **ssh.md** — Run on demand via SSH

Each file has a prompt you can give Claude to set it up.

## CLAUDE.md

Your project's `CLAUDE.md` defines what Claude does when triggered. See the included template.

## Files

```
claude-code-remote/
├── README.md        # This file
├── CLAUDE.md        # Template for remote Claude behavior
├── remote-logs.sh   # Stream logs from remote (configure after setup)
└── triggers/        # Prompts for different trigger types
    ├── cron.md
    ├── webhook.md
    ├── github-issues.md
    ├── file-watch.md
    └── ssh.md
```

## License

MIT
