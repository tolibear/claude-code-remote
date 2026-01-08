# SSH Trigger

Run Claude Code on demand via SSH - manually or from another Claude.

## Prompt

```
Create a helper script on my remote server for running Claude Code tasks.

Server: [IP] (ssh key at [PATH])
Project: /home/[USER]/[PROJECT]

Create /home/[USER]/run-claude.sh that:
1. cd into the project
2. Pulls latest from git
3. Runs claude -p with the first argument as the prompt
4. Logs output to /home/[USER]/claude.log

Make it executable and add to PATH.
```

## Usage

**From local terminal:**
```bash
ssh server "run-claude.sh 'fix the bug in auth.ts'"
```

**From local Claude:**
Tell your local Claude:
```
SSH into my server and run: run-claude.sh "add a logout button"
Server: [IP], key at [PATH]
```

**Chain them:**
Your local Claude can orchestrate multiple remote Claudes.
