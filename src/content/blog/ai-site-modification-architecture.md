---
title: Building an AI Site Modification API
date: January 2026
description: The technical architecture behind using GitHub Issues + Copilot + Cloudflare Workers as an AI-powered site editing API.
featured: true
---

GitHub Copilot will pick up any issue assigned to it, explore the repo, and open a PR. Cloudflare Pages builds every branch and gives you a preview URL. Put these together and you get an API for AI-powered site modifications: POST a description, get back a preview, approve or reject.

Here's how I wired it up for this site.

## The architecture

```
ericvanlare.com (Cloudflare Pages)
├── /admin → React panel, calls Worker API
│
ericvanlare-api.workers.dev (Cloudflare Worker)
├── POST /api/ai-mod/request  → Create issue, assign Copilot
├── GET  /api/ai-mod/list     → List all requests + statuses
├── POST /api/ai-mod/approve  → Merge the PR
├── POST /api/ai-mod/reject   → Close the PR
├── POST /api/ai-mod/revise   → Close old, create new issue with feedback
└── POST /api/ai-mod/revert   → Create issue to undo merged changes
```

The Worker is the glue. It talks to GitHub's API, tracks which issues have PRs, and constructs preview URLs from branch names.

## The hard part: assigning Copilot

You can't just set `assignees: ["copilot"]` on an issue. Copilot is a bot, and GitHub's REST API won't accept bot usernames as assignees. You need the bot's internal node ID, which means GraphQL.

First, query for actors that can be assigned to issues in your repo:

```graphql
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    suggestedActors(capabilities: [CAN_BE_ASSIGNED], first: 20) {
      nodes {
        login
        __typename
        ... on Bot { id }
        ... on User { id }
      }
    }
  }
}
```

Look for the node where `login` is `"copilot-swe-agent"` and `__typename` is `"Bot"`. Grab its `id`.

Then get the issue's node ID:

```graphql
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) { id }
  }
}
```

Finally, assign the bot:

```graphql
mutation($issueId: ID!, $assigneeIds: [ID!]!) {
  addAssigneesToAssignable(input: {
    assignableId: $issueId,
    assigneeIds: $assigneeIds
  }) {
    assignable { ... on Issue { id } }
  }
}
```

This isn't documented anywhere obvious. I found it by poking around the GraphQL explorer and reading forum threads.

## Matching issues to PRs

Copilot creates a PR but doesn't give you a webhook or callback. You have to poll. The Worker fetches recent PRs and tries to match them to issues by:

1. Branch name containing the issue number
2. PR body containing "fixes #N" or "closes #N"

```javascript
const linkedPr = prs.find(pr => {
  // Check branch name
  if (pr.head.ref.includes(issueNumber)) return true;
  
  // Check PR body for "fixes #N" pattern
  if (pr.body) {
    const pattern = new RegExp(
      `(fixes|closes|resolves)\\s+.*#${issueNumber}\\b`, 'i'
    );
    if (pattern.test(pr.body)) return true;
  }
  return false;
});
```

It's fuzzy, but Copilot is consistent enough that it works.

## Preview URLs

Cloudflare Pages preview URLs follow a predictable pattern:

```
https://{branch-slug}.{project}.pages.dev
```

The branch slug is the branch name, lowercased, with slashes replaced by hyphens, truncated to 28 characters. The Worker constructs this URL and pings it with a HEAD request. If it responds, the preview is ready.

```typescript
async function getPreviewUrl(branchRef: string) {
  let slug = branchRef.replace(/\//g, '-').toLowerCase();
  if (slug.length > 28) slug = slug.substring(0, 28);
  
  const url = `https://${slug}.ericvanlare-dot-com.pages.dev`;
  
  const response = await fetch(url, { method: 'HEAD' });
  return { url, ready: response.ok };
}
```

## The revision flow

What if the preview looks wrong? The naive approach would be to comment on the PR or the issue. But Copilot doesn't reliably pick up comments on existing issues.

So I went dumb: close the old issue, close the old PR, create a fresh issue with the original description plus new feedback. No state machine, no tracking thread. Each attempt is independent.

```typescript
// Close old PR
await github.patch(`/pulls/${prNumber}`, { state: 'closed' });

// Close old issue
await github.patch(`/issues/${issueNumber}`, { state: 'closed' });

// Create new issue with combined context
await github.post('/issues', {
  title: `[AI] Revision: ${originalDescription}`,
  body: `## Original request\n${originalDescription}\n\n## Feedback\n${feedback}`,
  labels: ['ai-modification'],
});
// Then assign Copilot...
```

It's wasteful—you end up with a trail of closed issues and PRs—but it's simple and it works.

## The admin UI

The frontend is a React component that:

- Lists all requests with their current status
- Shows the preview in an iframe when ready
- Provides approve/reject/revise buttons
- Has a textarea for revision feedback

Status is derived from the issue and PR state: pending (no PR yet), building (PR exists but preview 404s), preview_ready (preview responds), applied (PR merged), discarded (PR closed without merge).

## What I'd do differently

**Webhooks instead of polling.** GitHub can POST to your Worker when issues or PRs change. I didn't set this up because polling was simpler to debug, but it would make the UI feel more responsive.

**Store state in KV.** Right now the Worker reconstructs everything from GitHub's API on each request. A KV cache would reduce API calls and let me track things GitHub doesn't expose, like "this issue was a revision of that one."

**Better error handling.** If Copilot doesn't pick up an issue (it happens), there's no retry mechanism. The request just sits in "pending" forever.

## Is it worth building?

If you have a simple static site and want to experiment with AI-assisted editing, yes. The whole thing is about 500 lines of Worker code and 300 lines of React. It took an afternoon to build.

The real value isn't the automation—it's the workflow. Having a dedicated place to submit changes, see previews, and approve or reject forces a review step that "just push to main" doesn't have. The AI is almost incidental; the structure is what matters.
