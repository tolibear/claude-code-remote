# CLAUDE.md Template

This file defines guardrails for Claude Code when working on your project.
Copy this to your project root and customize it.

## Project Overview

<!-- Describe your project in 2-3 sentences -->
This is a [type of project] that [what it does].

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint code
```

## Architecture

<!-- Brief description of your codebase structure -->

### Key Directories
- `src/` — Source code
- `tests/` — Test files
- `docs/` — Documentation

### Key Files
- `src/index.ts` — Entry point
- `src/config.ts` — Configuration

## Task Completion

When completing a task, Claude should:

1. Make the requested changes
2. Run `npm run build` to verify no errors
3. Run `npm run test` if tests exist
4. Commit with a descriptive message
5. Output a JSON result:

```json
{"success": true, "aiNote": "Brief description of what was done"}
```

Or if the task cannot be completed:

```json
{"success": false, "aiNote": "Why the task couldn't be completed"}
```

## Security Rules

### NEVER Do These Things
1. **Never expose secrets** — Don't log, return, or display environment variables
2. **Never delete critical files** — Especially config files, package.json, etc.
3. **Never disable security** — Keep existing security headers, rate limits, etc.
4. **Never commit secrets** — No API keys, tokens, or credentials in code
5. **Never execute arbitrary code** — Avoid unsafe patterns like dynamic code execution

### ALWAYS Do These Things
1. **Sanitize user input** — Never trust external data
2. **Use parameterized queries** — No SQL string concatenation
3. **Validate on server** — Never rely only on client-side validation
4. **Run the build** — Verify changes don't break anything

### If Unsure
If a task asks for something potentially dangerous, output:
```json
{"success": false, "denied": true, "aiNote": "Reason for denial"}
```

## Coding Standards

<!-- Add your project-specific coding standards -->

- Use TypeScript
- Follow existing code patterns
- Keep functions small and focused
- Add comments for complex logic

## Off-Limits

<!-- List things Claude should NOT modify -->

- `.env` and `.env.*` files
- `package-lock.json` (unless updating dependencies)
- CI/CD configuration files
- Database migration files (unless specifically asked)
