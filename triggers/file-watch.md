# File Watch Trigger

Set up Claude Code to watch a file for new tasks.

## Prompt

```
Set up my remote server to watch a tasks.json file and process tasks.

Server: [IP] (ssh key at [PATH])
Project: /home/[USER]/[PROJECT]
Tasks file: /home/[USER]/[PROJECT]/tasks.json

The tasks.json format:
[
  {"id": "1", "prompt": "Fix the login bug", "status": "pending"},
  {"id": "2", "prompt": "Add dark mode", "status": "pending"}
]

Create a script that:
1. Watches tasks.json for changes (or polls every 30 seconds)
2. Picks the first task with status "pending"
3. Changes its status to "in_progress"
4. Runs Claude with that prompt
5. Changes status to "done" when complete
6. Loops forever

Run as a systemd service.
```

## Adding Tasks

Just edit tasks.json or have another system write to it:
```bash
ssh server "echo '[{\"id\":\"1\",\"prompt\":\"Fix bug\",\"status\":\"pending\"}]' > tasks.json"
```
