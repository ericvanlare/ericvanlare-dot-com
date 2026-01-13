function DiagrammingAgentPost() {
  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-200 leading-relaxed">
      <p>
        AI is writing more of our code every day. You leave an agent running, come back, 
        and who knows what's changed. Having a map helps.
      </p>
      <p>
        The problem is most AI-generated diagrams are useless. Boxes labeled "AuthService" 
        and "DatabaseLayer" — but click on them and nothing happens. You can't tell if 
        "PaymentProcessor" is a class, a file, or something the model hallucinated.
      </p>
      <p>
        The fix is simple: <strong>ground every node in actual code</strong>. Each box 
        maps to a file and line range. Now the diagram isn't decoration — it's a navigation 
        surface.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The prompt
      </h2>
      <p>
        Here's what works. Paste this into Claude Code, Amp, Cursor, or any coding agent:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
{`Please generate a mermaid diagram (in a .mmd file) that shows this codebase as an ontology. Make it comprehensive.

Every single node should be groundable in a specific line of code, set of lines from a file, or sets of lines from multiple files.

Generate that mapping as well and put it in a separate .naiad file — a JSON object where keys are node IDs and values are objects with "file" and "lines" properties.`}
      </pre>
      <p>
        The key insight: by asking for the grounding file separately, you force the agent 
        to actually verify each node corresponds to real code. No more hallucinated boxes.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        What you get
      </h2>
      <p>
        Two files. First, a standard Mermaid diagram:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`flowchart TD
    auth[AuthService]
    db[DatabaseLayer]
    pay[PaymentProcessor]
    
    auth --> db
    auth --> pay
    pay --> db`}
      </pre>
      <p>
        Second, a grounding file that maps each node to code:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "auth": {
    "file": "src/auth/service.ts",
    "lines": [1, 145]
  },
  "db": {
    "file": "src/db/index.ts",
    "lines": [1, 89]
  },
  "pay": {
    "file": "src/payments/processor.ts",
    "lines": [12, 203]
  }
}`}
      </pre>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        Three ways to use this
      </h2>
      
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">
        1. Paste the prompt
      </h3>
      <p>
        Copy the prompt above into any coding agent. Works immediately.
      </p>

      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">
        2. Shell alias
      </h3>
      <p>
        Add this to your shell config for one-command diagrams:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`alias diagram='claude -p "Generate a mermaid diagram (.mmd) showing this codebase as an ontology. Every node must map to real code. Generate a .naiad file with the grounding: JSON object, keys are node IDs, values have file and lines properties."'`}
      </pre>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Replace <code>claude</code> with <code>amp</code> or your agent of choice.
      </p>

      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">
        3. Agent skill (Amp/Claude Code)
      </h3>
      <p>
        For agents that support skills, create a <code>SKILL.md</code> file in your repo:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
{`---
name: diagram
description: Generate a grounded codebase diagram
---

Generate a comprehensive mermaid diagram showing this codebase as an ontology.

Requirements:
- Output a .mmd file with the Mermaid diagram
- Every node must correspond to actual code
- Output a .naiad file with grounding metadata
- The .naiad file is JSON: keys are node IDs, values are {file, lines}

Start by exploring the codebase structure, then build the diagram iteratively.`}
      </pre>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        Why this works
      </h2>
      <p>
        Most "diagram my codebase" prompts fail because they don't constrain the output. 
        The agent draws whatever looks reasonable, with no accountability.
      </p>
      <p>
        By requiring a separate grounding file, you create a verification mechanism. 
        The agent has to commit to specific file paths and line numbers. If it can't 
        find real code to back a node, it either drops the node or the discrepancy 
        becomes obvious.
      </p>
      <p>
        The result: diagrams you can actually use to navigate a codebase, not just 
        admire once and forget.
      </p>
    </div>
  );
}

export default DiagrammingAgentPost;
