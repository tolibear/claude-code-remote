/**
 * GitHub Issues trigger
 *
 * Polls GitHub for issues with a specific label and creates tasks from them.
 * Great for "AI-ready" issue triage - label issues you want Claude to work on.
 *
 * Usage:
 *   npm start triggers/github-issues-trigger.ts
 *
 * Environment variables:
 *   GITHUB_TOKEN=xxx              GitHub personal access token (required)
 *   GITHUB_REPO=owner/repo        Repository to watch (required)
 *   GITHUB_LABEL=claude-ready     Label to filter issues (default: claude-ready)
 *   GITHUB_POLL_MINUTES=5         Poll interval in minutes (default: 5)
 *
 * How it works:
 *   1. Fetches issues with the specified label
 *   2. Creates a task for each issue
 *   3. When task completes, comments on the issue and removes the label
 */

import type { TriggerAdapter, Task, TaskResult } from '../src/types.js'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_LABEL = process.env.GITHUB_LABEL || 'claude-ready'
const POLL_MINUTES = parseInt(process.env.GITHUB_POLL_MINUTES || '5', 10)

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required')
  process.exit(1)
}

if (!GITHUB_REPO) {
  console.error('GITHUB_REPO is required (format: owner/repo)')
  process.exit(1)
}

interface GitHubIssue {
  number: number
  title: string
  body: string
  html_url: string
}

const processedIssues = new Set<number>()
let lastPoll = 0

async function fetchIssues(): Promise<GitHubIssue[]> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=${encodeURIComponent(GITHUB_LABEL)}&state=open`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

async function commentOnIssue(issueNumber: number, body: string): Promise<void> {
  await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    }
  )
}

async function removeLabel(issueNumber: number): Promise<void> {
  await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/labels/${encodeURIComponent(GITHUB_LABEL)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )
}

const trigger: TriggerAdapter = {
  async getNextTask(): Promise<Task | null> {
    // Only poll every N minutes
    const now = Date.now()
    if (now - lastPoll < POLL_MINUTES * 60 * 1000) {
      return null
    }
    lastPoll = now

    console.log(`[GitHub] Checking for issues with label: ${GITHUB_LABEL}`)

    try {
      const issues = await fetchIssues()

      for (const issue of issues) {
        if (processedIssues.has(issue.number)) {
          continue
        }

        processedIssues.add(issue.number)

        const prompt = `You are working on GitHub issue #${issue.number}.

## Issue Title
${issue.title}

## Issue Description
${issue.body || 'No description provided.'}

## Instructions
1. Analyze the issue and understand what needs to be done
2. Make the necessary changes to fix/implement this issue
3. Run any relevant tests
4. Commit your changes with a message referencing the issue: "Fix #${issue.number}: <description>"

If the issue is unclear or impossible to implement, explain why in your response.

Output a JSON result at the end:
{"success": true, "aiNote": "Brief description of what was done"}
or
{"success": false, "aiNote": "Why this couldn't be completed"}`

        return {
          id: `github-issue-${issue.number}`,
          prompt,
          metadata: {
            issueNumber: issue.number,
            issueUrl: issue.html_url,
          },
        }
      }
    } catch (err) {
      console.error(`[GitHub] Error fetching issues: ${err}`)
    }

    return null
  },

  async onTaskComplete(result: TaskResult): Promise<void> {
    const issueNumber = result.taskId.replace('github-issue-', '')

    let comment: string
    if (result.success) {
      comment = `## Claude completed this task

**Status:** ${result.status}
**Commit:** ${result.commitHash || 'N/A'}

**Summary:**
${result.aiNote}

---
*Automated by [headless-claude-subscription](https://github.com/your-username/headless-claude-subscription)*`
    } else {
      comment = `## Claude was unable to complete this task

**Status:** ${result.status}

**Notes:**
${result.aiNote}

---
*Automated by [headless-claude-subscription](https://github.com/your-username/headless-claude-subscription)*`
    }

    try {
      await commentOnIssue(parseInt(issueNumber), comment)
      await removeLabel(parseInt(issueNumber))
      console.log(`[GitHub] Updated issue #${issueNumber}`)
    } catch (err) {
      console.error(`[GitHub] Error updating issue: ${err}`)
    }
  },

  async onStartup(): Promise<void> {
    console.log(`[GitHub] Watching ${GITHUB_REPO} for issues with label: ${GITHUB_LABEL}`)
    console.log(`[GitHub] Poll interval: ${POLL_MINUTES} minutes`)
  },
}

export default trigger
