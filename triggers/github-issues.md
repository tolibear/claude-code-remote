# GitHub Issues Trigger

Set up Claude Code to automatically fix GitHub issues with a specific label.

## Prompt

```
Set up my remote server to automatically process GitHub issues.

Server: [IP] (ssh key at [PATH])
Project: /home/[USER]/[PROJECT]
GitHub repo: [OWNER]/[REPO]
Label to watch: "claude-ready"

Create a script that:
1. Uses GitHub CLI (gh) to fetch open issues with the label
2. For each issue, runs Claude with the issue details as the prompt
3. After Claude commits, comments on the issue with what was done
4. Removes the label

Run this as a cron job every 10 minutes.

I'll need to set up a GitHub token - walk me through that.
```

## How It Works

1. Label an issue "claude-ready"
2. Within 10 minutes, Claude picks it up
3. Claude implements the fix, commits, pushes
4. Claude comments on the issue and removes the label
