interface Env {
  ADMIN_ORIGIN: string;
  GITHUB_TOKEN: string;
}

const GITHUB_OWNER = 'ericvanlare';
const GITHUB_REPO = 'ericvanlare-dot-com';

function corsHeaders(origin: string, adminOrigin: string): HeadersInit {
  const allowedOrigin = origin === adminOrigin ? adminOrigin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

function jsonResponse<T>(
  data: ApiResponse<T>,
  status: number,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  merged_at: string | null;
  head: {
    ref: string;
    sha: string;
  };
}

async function githubApi<T>(
  env: Env,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ericvanlare-api',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function githubGraphQL<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ericvanlare-api',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL error: ${response.status} ${text}`);
  }

  const result = await response.json() as GraphQLResponse<T>;
  if (result.errors && result.errors.length > 0) {
    throw new Error(`GitHub GraphQL error: ${result.errors[0].message}`);
  }

  return result.data as T;
}

interface AiModRequest {
  description: string;
}

async function handleAiModRequest(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  try {
    const body = await request.json() as AiModRequest;
    
    if (!body.description || body.description.trim().length === 0) {
      return jsonResponse(
        { success: false, error: 'Description is required' },
        400,
        cors
      );
    }

    const issueBody = `## Site Modification Request

${body.description}

---
*This issue was created from the admin panel. Copilot will work on this and create a PR.*
`;

    const issue = await githubApi<GitHubIssue>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[AI] ${body.description.slice(0, 60)}${body.description.length > 60 ? '...' : ''}`,
          body: issueBody,
          labels: ['ai-modification'],
        }),
      }
    );

    let copilotAssigned = false;
    try {
      interface SuggestedActorsResponse {
        repository: {
          suggestedActors: {
            nodes: Array<{ login: string; id: string; __typename: string }>;
          };
        };
      }
      
      const actorsResult = await githubGraphQL<SuggestedActorsResponse>(
        env,
        `query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            suggestedActors(capabilities: [CAN_BE_ASSIGNED], first: 20) {
              nodes {
                login
                __typename
                ... on Bot {
                  id
                }
                ... on User {
                  id
                }
              }
            }
          }
        }`,
        { owner: GITHUB_OWNER, name: GITHUB_REPO }
      );

      const copilotBot = actorsResult.repository.suggestedActors.nodes.find(
        (node) => node.login === 'copilot-swe-agent' && node.__typename === 'Bot'
      );

      if (copilotBot) {
        interface IssueIdResponse {
          repository: { issue: { id: string } };
        }
        
        const issueResult = await githubGraphQL<IssueIdResponse>(
          env,
          `query($owner: String!, $name: String!, $number: Int!) {
            repository(owner: $owner, name: $name) {
              issue(number: $number) {
                id
              }
            }
          }`,
          { owner: GITHUB_OWNER, name: GITHUB_REPO, number: issue.number }
        );

        await githubGraphQL<unknown>(
          env,
          `mutation($issueId: ID!, $assigneeIds: [ID!]!) {
            addAssigneesToAssignable(input: {
              assignableId: $issueId,
              assigneeIds: $assigneeIds
            }) {
              assignable {
                ... on Issue {
                  id
                }
              }
            }
          }`,
          { 
            issueId: issueResult.repository.issue.id, 
            assigneeIds: [copilotBot.id] 
          }
        );
        copilotAssigned = true;
      }
    } catch {
      // Copilot assignment failed - continue anyway
    }

    return jsonResponse({
      success: true,
      data: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        status: 'pending',
        copilotAssigned,
      },
    }, 201, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to create AI modification request', details: message },
      500,
      cors
    );
  }
}

async function handleAiModStatus(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  const url = new URL(request.url);
  const issueNumber = url.searchParams.get('issue');

  if (!issueNumber) {
    return jsonResponse(
      { success: false, error: 'Issue number is required' },
      400,
      cors
    );
  }

  try {
    const issue = await githubApi<GitHubIssue>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`
    );

    const prs = await githubApi<GitHubPullRequest[]>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=all&per_page=20`
    );

    const linkedPr = prs.find(pr => {
      if (pr.head.ref.includes(issueNumber) || pr.head.ref.includes(`issue-${issueNumber}`)) {
        return true;
      }
      if (pr.body) {
        const fixesPattern = new RegExp(`(fixes|closes|resolves)\\s+.*#${issueNumber}\\b`, 'i');
        if (fixesPattern.test(pr.body)) {
          return true;
        }
      }
      return false;
    });

    let previewUrl: string | null = null;
    let prStatus: string = 'not_found';

    if (linkedPr) {
      prStatus = linkedPr.merged_at ? 'merged' : linkedPr.state;

      if (!linkedPr.merged_at && linkedPr.state === 'open') {
        let branchSlug = linkedPr.head.ref.replace(/\//g, '-').toLowerCase();
        if (branchSlug.length > 28) {
          branchSlug = branchSlug.substring(0, 28);
        }
        previewUrl = `https://${branchSlug}.ericvanlare-dot-com.pages.dev`;
      }
    }

    return jsonResponse({
      success: true,
      data: {
        issueNumber: parseInt(issueNumber),
        issueState: issue.state,
        prNumber: linkedPr?.number ?? null,
        prUrl: linkedPr?.html_url ?? null,
        prState: prStatus,
        previewUrl,
        status: linkedPr 
          ? (linkedPr.merged_at ? 'merged' : (previewUrl ? 'preview_ready' : 'pr_created'))
          : 'pending',
      },
    }, 200, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to get status', details: message },
      500,
      cors
    );
  }
}

interface PreviewUrlResult {
  url: string;
  confirmed: boolean;
}

async function getPreviewUrlForBranch(branchRef: string): Promise<PreviewUrlResult> {
  let branchSlug = branchRef.replace(/\//g, '-').toLowerCase();
  if (branchSlug.length > 28) {
    branchSlug = branchSlug.substring(0, 28);
  }
  const url = `https://${branchSlug}.ericvanlare-dot-com.pages.dev`;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const confirmed = response.ok;
    return { url, confirmed };
  } catch {
    return { url, confirmed: false };
  }
}

async function handleAiModList(
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  try {
    const issues = await githubApi<GitHubIssue[]>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?labels=ai-modification&state=all&per_page=20&sort=created&direction=desc`
    );

    const prs = await githubApi<GitHubPullRequest[]>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=all&per_page=30`
    );

    const requests = await Promise.all(
      issues.map(async (issue) => {
        const issueNumStr = String(issue.number);
        const linkedPr = prs.find(pr => {
          if (pr.head.ref.includes(issueNumStr) || pr.head.ref.includes(`issue-${issueNumStr}`)) {
            return true;
          }
          if (pr.body) {
            const fixesPattern = new RegExp(`(fixes|closes|resolves)\\s+.*#${issue.number}\\b`, 'i');
            if (fixesPattern.test(pr.body)) {
              return true;
            }
          }
          return false;
        });

        let previewUrl: string | null = null;
        let status = 'pending';

        const wasReplaced = issue.body?.includes('This replaces issue #') || false;
        const isMerged = linkedPr && linkedPr.merged_at !== null;
        const wasDiscarded = linkedPr && linkedPr.state === 'closed' && !isMerged;

        if (wasReplaced && issue.state === 'closed') {
          status = 'replaced';
        } else if (wasDiscarded) {
          status = 'discarded';
        } else if (linkedPr) {
          if (isMerged) {
            status = 'applied';
          } else if (linkedPr.state === 'open') {
            const preview = await getPreviewUrlForBranch(linkedPr.head.ref);
            previewUrl = preview.url;
            status = preview.confirmed ? 'preview_ready' : 'building';
          }
        }

        let description = issue.title.replace(/^\[AI\]\s*/, '');
        description = description.replace(/^(Revision|Revert):\s*/, '');

        return {
          issueNumber: issue.number,
          issueUrl: issue.html_url,
          issueState: issue.state,
          description,
          createdAt: issue.state,
          prNumber: linkedPr?.number ?? null,
          prUrl: linkedPr?.html_url ?? null,
          previewUrl,
          status,
        };
      })
    );

    return jsonResponse({ success: true, data: requests }, 200, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to list requests', details: message },
      500,
      cors
    );
  }
}

async function handleAiModApprove(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  try {
    const body = await request.json() as { prNumber: number };

    if (!body.prNumber) {
      return jsonResponse(
        { success: false, error: 'PR number is required' },
        400,
        cors
      );
    }

    await githubApi<unknown>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${body.prNumber}/merge`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merge_method: 'squash',
        }),
      }
    );

    return jsonResponse({
      success: true,
      data: { prNumber: body.prNumber, merged: true },
    }, 200, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to merge PR', details: message },
      500,
      cors
    );
  }
}

async function handleAiModReject(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  try {
    const body = await request.json() as { prNumber: number };

    if (!body.prNumber) {
      return jsonResponse(
        { success: false, error: 'PR number is required' },
        400,
        cors
      );
    }

    await githubApi<unknown>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${body.prNumber}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'closed' }),
      }
    );

    return jsonResponse({
      success: true,
      data: { prNumber: body.prNumber, closed: true },
    }, 200, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to reject changes', details: message },
      500,
      cors
    );
  }
}

async function handleAiModRevise(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  try {
    const body = await request.json() as { 
      issueNumber: number; 
      prNumber: number;
      originalDescription: string;
      feedback: string;
    };

    if (!body.issueNumber || !body.prNumber) {
      return jsonResponse(
        { success: false, error: 'Issue number and PR number are required' },
        400,
        cors
      );
    }

    if (!body.feedback || body.feedback.trim().length === 0) {
      return jsonResponse(
        { success: false, error: 'Feedback is required' },
        400,
        cors
      );
    }

    await githubApi<unknown>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${body.prNumber}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'closed' }),
      }
    );

    await githubApi<unknown>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${body.issueNumber}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'closed' }),
      }
    );

    const issueBody = `## Site Modification Request

${body.originalDescription}

### Additional Changes Requested:
${body.feedback}

---
*This replaces issue #${body.issueNumber}. Copilot will work on this and create a PR.*
`;

    const issue = await githubApi<GitHubIssue>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[AI] Revision: ${body.originalDescription.slice(0, 50)}${body.originalDescription.length > 50 ? '...' : ''}`,
          body: issueBody,
          labels: ['ai-modification'],
        }),
      }
    );

    let copilotAssigned = false;
    try {
      interface SuggestedActorsResponse {
        repository: {
          suggestedActors: {
            nodes: Array<{ login: string; id: string; __typename: string }>;
          };
        };
      }
      
      const actorsResult = await githubGraphQL<SuggestedActorsResponse>(
        env,
        `query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            suggestedActors(capabilities: [CAN_BE_ASSIGNED], first: 20) {
              nodes {
                login
                __typename
                ... on Bot {
                  id
                }
                ... on User {
                  id
                }
              }
            }
          }
        }`,
        { owner: GITHUB_OWNER, name: GITHUB_REPO }
      );

      const copilotBot = actorsResult.repository.suggestedActors.nodes.find(
        (node) => node.login === 'copilot-swe-agent' && node.__typename === 'Bot'
      );

      if (copilotBot) {
        interface IssueIdResponse {
          repository: { issue: { id: string } };
        }
        
        const issueResult = await githubGraphQL<IssueIdResponse>(
          env,
          `query($owner: String!, $name: String!, $number: Int!) {
            repository(owner: $owner, name: $name) {
              issue(number: $number) {
                id
              }
            }
          }`,
          { owner: GITHUB_OWNER, name: GITHUB_REPO, number: issue.number }
        );

        await githubGraphQL<unknown>(
          env,
          `mutation($issueId: ID!, $assigneeIds: [ID!]!) {
            addAssigneesToAssignable(input: {
              assignableId: $issueId,
              assigneeIds: $assigneeIds
            }) {
              assignable {
                ... on Issue {
                  id
                }
              }
            }
          }`,
          { 
            issueId: issueResult.repository.issue.id, 
            assigneeIds: [copilotBot.id] 
          }
        );
        copilotAssigned = true;
      }
    } catch {
      // Copilot assignment failed - continue anyway
    }

    return jsonResponse({
      success: true,
      data: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        copilotAssigned,
        replacedIssue: body.issueNumber,
      },
    }, 201, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to create revision', details: message },
      500,
      cors
    );
  }
}

async function handleAiModRevert(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  try {
    const body = await request.json() as { prNumber: number; description: string };

    if (!body.prNumber) {
      return jsonResponse(
        { success: false, error: 'PR number is required' },
        400,
        cors
      );
    }

    const issueBody = `## Site Modification Request

Undo the changes from PR #${body.prNumber}.

Original change: ${body.description || 'No description available'}

Please revert the code changes made in that PR to restore the previous behavior.

---
*This is a revert request created from the admin panel. Copilot will work on this and create a PR.*
`;

    const issue = await githubApi<GitHubIssue>(
      env,
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[AI] Revert: ${body.description?.slice(0, 50) || `PR #${body.prNumber}`}`,
          body: issueBody,
          labels: ['ai-modification'],
        }),
      }
    );

    let copilotAssigned = false;
    try {
      interface SuggestedActorsResponse {
        repository: {
          suggestedActors: {
            nodes: Array<{ login: string; id: string; __typename: string }>;
          };
        };
      }
      
      const actorsResult = await githubGraphQL<SuggestedActorsResponse>(
        env,
        `query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            suggestedActors(capabilities: [CAN_BE_ASSIGNED], first: 20) {
              nodes {
                login
                __typename
                ... on Bot {
                  id
                }
                ... on User {
                  id
                }
              }
            }
          }
        }`,
        { owner: GITHUB_OWNER, name: GITHUB_REPO }
      );

      const copilotBot = actorsResult.repository.suggestedActors.nodes.find(
        (node) => node.login === 'copilot-swe-agent' && node.__typename === 'Bot'
      );

      if (copilotBot) {
        interface IssueIdResponse {
          repository: { issue: { id: string } };
        }
        
        const issueResult = await githubGraphQL<IssueIdResponse>(
          env,
          `query($owner: String!, $name: String!, $number: Int!) {
            repository(owner: $owner, name: $name) {
              issue(number: $number) {
                id
              }
            }
          }`,
          { owner: GITHUB_OWNER, name: GITHUB_REPO, number: issue.number }
        );

        await githubGraphQL<unknown>(
          env,
          `mutation($issueId: ID!, $assigneeIds: [ID!]!) {
            addAssigneesToAssignable(input: {
              assignableId: $issueId,
              assigneeIds: $assigneeIds
            }) {
              assignable {
                ... on Issue {
                  id
                }
              }
            }
          }`,
          { 
            issueId: issueResult.repository.issue.id, 
            assigneeIds: [copilotBot.id] 
          }
        );
        copilotAssigned = true;
      }
    } catch {
      // Copilot assignment failed - continue anyway
    }

    return jsonResponse({
      success: true,
      data: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        copilotAssigned,
      },
    }, 201, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to create revert request', details: message },
      500,
      cors
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env.ADMIN_ORIGIN);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/ai-mod/request' && request.method === 'POST') {
      return handleAiModRequest(request, env, cors);
    }

    if (url.pathname === '/api/ai-mod/list' && request.method === 'GET') {
      return handleAiModList(env, cors);
    }

    if (url.pathname === '/api/ai-mod/status' && request.method === 'GET') {
      return handleAiModStatus(request, env, cors);
    }

    if (url.pathname === '/api/ai-mod/approve' && request.method === 'POST') {
      return handleAiModApprove(request, env, cors);
    }

    if (url.pathname === '/api/ai-mod/reject' && request.method === 'POST') {
      return handleAiModReject(request, env, cors);
    }

    if (url.pathname === '/api/ai-mod/revise' && request.method === 'POST') {
      return handleAiModRevise(request, env, cors);
    }

    if (url.pathname === '/api/ai-mod/revert' && request.method === 'POST') {
      return handleAiModRevert(request, env, cors);
    }

    if (url.pathname === '/health') {
      return jsonResponse({ success: true, data: { status: 'ok' } }, 200, cors);
    }

    return jsonResponse({ success: false, error: 'Not found' }, 404, cors);
  },
};
