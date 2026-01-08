# Webhook Trigger

Set up an HTTP endpoint that triggers Claude Code when called.

## Prompt

```
Set up a simple webhook server on my remote server that triggers Claude Code.

Server: [IP] (ssh key at [PATH])
Project: /home/[USER]/[PROJECT]
Port: 3000

When POST /trigger is called:
1. cd into the project directory
2. Run Claude with the prompt from the request body
3. Return the result

Use Node.js or Python - whatever's simpler.
Set it up as a systemd service so it starts on boot.
```

## Example Usage

```bash
curl -X POST http://your-server:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Fix the login bug"}'
```

## Security Note

Add authentication if exposing to the internet:
```
Add a secret header check: x-webhook-secret: [YOUR_SECRET]
```
