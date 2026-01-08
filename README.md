# remote-ralph

Run Claude Code on a remote server using your subscription (not API).

## Why

**Cost:**
- Claude Max (Opus 4.5): **$200/month** flat
- Equivalent API usage: **$1,500-3,000/month**

Opus 4.5 API pricing is $15/million input tokens and $75/million output tokens. A heavy coding day burns $50-100. That's $1,500-3,000/month if you're using Claude Code daily.

With Max subscription, you get the same Opus 4.5 for $200/month. This repo helps you run it on a server so it works while you sleep.

## What You Do

1. Set up a VPS (AWS, Hostinger, DigitalOcean - ask Claude for help)
2. Give Claude the prompt below
3. Click one auth link
4. Done

## The Prompt

Copy this and give it to your local Claude Code:

```
I need you to set up Claude Code on my remote server so it can run autonomously.

Server details:
- Host: [YOUR_SERVER_IP]
- User: [YOUR_USERNAME]
- SSH key: [PATH_TO_YOUR_KEY or "password auth"]

Steps:
1. SSH into the server
2. Install Node.js if not present
3. Install Claude Code globally (npm install -g @anthropic-ai/claude-code)
4. Run `claude` to start authentication
5. Give me the auth URL it outputs - I'll click it and give you the code
6. Enter the code to complete auth
7. Verify it's working with a simple test

Let me know when you need the auth code from me.
```

Claude will handle everything. When it gives you an auth URL, open it in your browser, log in, and paste the code back.

## After Setup

Your remote server now has an authenticated Claude Code. Use it however you want:

**Run directly:**
```bash
ssh server "cd /path/to/project && claude -p 'fix the bug in auth.ts'"
```

**Cron job:**
```bash
0 * * * * cd /home/you/project && claude -p "check for issues and fix them"
```

**From another Claude:**
Your local Claude can SSH in and tell remote Claude what to do.

## CLAUDE.md

Put a CLAUDE.md in your project to define what Claude should do when triggered:

```markdown
# CLAUDE.md

When you run, do the following:
1. Pull latest changes
2. Check for GitHub issues labeled "ready"
3. Pick the highest priority one
4. Implement it
5. Run tests
6. Commit and push
7. Comment on the issue with what you did
```

## Need Help Setting Up a VPS?

Give Claude this prompt:

```
Help me set up a VPS for running Claude Code. I want the cheapest option that works.
Walk me through creating an account and server on [Hostinger/AWS/DigitalOcean].
```

## License

MIT
