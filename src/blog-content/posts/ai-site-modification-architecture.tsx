function AiSiteModificationArchitecturePost() {
  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-200 leading-relaxed">
      <p>
        GitHub Copilot will pick up any issue assigned to it, explore the repo, and open a PR.
        Cloudflare Pages builds every branch and gives you a preview URL. Put these together
        and you get an API for AI-powered site modifications: POST a description, get back
        a preview, approve or reject.
      </p>
      <p>
        Here's how I wired it up for this site.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The architecture
      </h2>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`ericvanlare.com (Cloudflare Pages)
├── /admin → React panel, calls Worker API
│
ericvanlare-api.workers.dev (Cloudflare Worker)
├── POST /api/ai-mod/request  → Create issue, assign Copilot
├── GET  /api/ai-mod/list     → List all requests + statuses
├── POST /api/ai-mod/approve  → Merge the PR
├── POST /api/ai-mod/reject   → Close the PR
├── POST /api/ai-mod/revise   → Close old, create new issue with feedback
└── POST /api/ai-mod/revert   → Create issue to undo merged changes`}
      </pre>
      <p>
        The Worker is the glue. It talks to GitHub's API, tracks which issues have PRs,
        and constructs preview URLs from branch names.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The hard part: assigning Copilot
      </h2>
      <p>
        You can't just set <code>assignees: ["copilot"]</code> on an issue. Copilot is a bot,
        and GitHub's REST API won't accept bot usernames as assignees. You need the bot's
        internal node ID, which means GraphQL.
      </p>
      <p>
        First, query for actors that can be assigned to issues in your repo:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`query($owner: String!, $name: String!) {
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
}`}
      </pre>
      <p>
        Look for the node where <code>login</code> is <code>"copilot-swe-agent"</code> and{' '}
        <code>__typename</code> is <code>"Bot"</code>. Grab its <code>id</code>.
      </p>
      <p>
        Then get the issue's node ID:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) { id }
  }
}`}
      </pre>
      <p>
        Finally, assign the bot:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`mutation($issueId: ID!, $assigneeIds: [ID!]!) {
  addAssigneesToAssignable(input: {
    assignableId: $issueId,
    assigneeIds: $assigneeIds
  }) {
    assignable { ... on Issue { id } }
  }
}`}
      </pre>
      <p>
        This isn't documented anywhere obvious. I found it by poking around the GraphQL
        explorer and reading forum threads.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        Matching issues to PRs
      </h2>
      <p>
        Copilot creates a PR but doesn't give you a webhook or callback. You have to poll.
        The Worker fetches recent PRs and tries to match them to issues by:
      </p>
      <ol className="list-decimal list-inside space-y-1 ml-4">
        <li>Branch name containing the issue number</li>
        <li>PR body containing "fixes #N" or "closes #N"</li>
      </ol>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`const linkedPr = prs.find(pr => {
  // Check branch name
  if (pr.head.ref.includes(issueNumber)) return true;
  
  // Check PR body for "fixes #N" pattern
  if (pr.body) {
    const pattern = new RegExp(
      \`(fixes|closes|resolves)\\\\s+.*#\${issueNumber}\\\\b\`, 'i'
    );
    if (pattern.test(pr.body)) return true;
  }
  return false;
});`}
      </pre>
      <p>
        It's fuzzy, but Copilot is consistent enough that it works.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        Preview URLs
      </h2>
      <p>
        Cloudflare Pages preview URLs follow a predictable pattern:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`https://{branch-slug}.{project}.pages.dev`}
      </pre>
      <p>
        The branch slug is the branch name, lowercased, with slashes replaced by hyphens,
        truncated to 28 characters. The Worker constructs this URL and pings it with a
        HEAD request. If it responds, the preview is ready.
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`async function getPreviewUrl(branchRef: string) {
  let slug = branchRef.replace(/\\//g, '-').toLowerCase();
  if (slug.length > 28) slug = slug.substring(0, 28);
  
  const url = \`https://\${slug}.ericvanlare-dot-com.pages.dev\`;
  
  const response = await fetch(url, { method: 'HEAD' });
  return { url, ready: response.ok };
}`}
      </pre>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The revision flow
      </h2>
      <p>
        What if the preview looks wrong? The naive approach would be to comment on the
        PR or the issue. But Copilot doesn't reliably pick up comments on existing issues.
      </p>
      <p>
        So I went dumb: close the old issue, close the old PR, create a fresh issue with
        the original description plus new feedback. No state machine, no tracking thread.
        Each attempt is independent.
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`// Close old PR
await github.patch(\`/pulls/\${prNumber}\`, { state: 'closed' });

// Close old issue
await github.patch(\`/issues/\${issueNumber}\`, { state: 'closed' });

// Create new issue with combined context
await github.post('/issues', {
  title: \`[AI] Revision: \${originalDescription}\`,
  body: \`## Original request\\n\${originalDescription}\\n\\n## Feedback\\n\${feedback}\`,
  labels: ['ai-modification'],
});
// Then assign Copilot...`}
      </pre>
      <p>
        It's wasteful—you end up with a trail of closed issues and PRs—but it's simple
        and it works.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The admin UI
      </h2>
      <p>
        The frontend is a React component that:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Lists all requests with their current status</li>
        <li>Shows the preview in an iframe when ready</li>
        <li>Provides approve/reject/revise buttons</li>
        <li>Has a textarea for revision feedback</li>
      </ul>
      <p>
        Status is derived from the issue and PR state: pending (no PR yet), building
        (PR exists but preview 404s), preview_ready (preview responds), applied (PR merged),
        discarded (PR closed without merge).
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        What I'd do differently
      </h2>
      <p>
        <strong>Webhooks instead of polling.</strong> GitHub can POST to your Worker when
        issues or PRs change. I didn't set this up because polling was simpler to debug,
        but it would make the UI feel more responsive.
      </p>
      <p>
        <strong>Store state in KV.</strong> Right now the Worker reconstructs everything
        from GitHub's API on each request. A KV cache would reduce API calls and let me
        track things GitHub doesn't expose, like "this issue was a revision of that one."
      </p>
      <p>
        <strong>Better error handling.</strong> If Copilot doesn't pick up an issue (it
        happens), there's no retry mechanism. The request just sits in "pending" forever.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        Is it worth building?
      </h2>
      <p>
        If you have a simple static site and want to experiment with AI-assisted editing,
        yes. The whole thing is about 500 lines of Worker code and 300 lines of React.
        It took an afternoon to build.
      </p>
      <p>
        The real value isn't the automation—it's the workflow. Having a dedicated place
        to submit changes, see previews, and approve or reject forces a review step that
        "just push to main" doesn't have. The AI is almost incidental; the structure is
        what matters.
      </p>
    </div>
  );
}

export default AiSiteModificationArchitecturePost;
