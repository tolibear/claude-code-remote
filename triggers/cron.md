# Cron Trigger

Set up Claude Code to run on a schedule.

## Prompt

```
Set up a cron job on my remote server to run Claude Code every [INTERVAL].

Server: [IP] (ssh key at [PATH])

The cron should:
1. cd into /home/[USER]/[PROJECT]
2. Run: claude -p "[YOUR_TASK]"
3. Log output to /home/[USER]/claude-cron.log

Example tasks:
- "Check for GitHub issues labeled 'ready' and fix them"
- "Run tests and fix any failures"
- "Update dependencies and commit"

Show me the crontab entry before adding it.
```

## Example

Run every hour to check for issues:
```
0 * * * * cd /home/ubuntu/myproject && claude -p "check for issues labeled ready and implement them" >> /home/ubuntu/claude-cron.log 2>&1
```
