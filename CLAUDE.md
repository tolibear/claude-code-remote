# CLAUDE.md

You are setting up and managing a remote Claude Code instance.

## After Server Setup

Once the remote server is authenticated, update `remote-logs.sh` with the correct:
- SSH key path
- Server IP/hostname
- Username

## Remote Claude Behavior

When running on the remote server, Claude should:
1. Pull latest changes from git
2. Check for work (issues, tasks, webhooks - depends on trigger)
3. Implement the work
4. Run tests if they exist
5. Commit and push
6. Report what was done

## Security

- Never expose environment variables or secrets
- Never delete critical files
- Always commit changes (git is the safety net)
- If unsure about something, ask or skip it

## Project-Specific Instructions

Add your project-specific instructions below this line:

---
