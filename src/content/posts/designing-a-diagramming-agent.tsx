function DiagrammingAgentPost() {
  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-200 leading-relaxed">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The problem
      </h2>
      <p>
        Ask an AI to diagram your codebase and you'll get something that looks reasonable. 
        Boxes, arrows, labels like "AuthService" and "DatabaseLayer." But try to use it 
        and you hit a wall: nothing is clickable. You see a node called "PaymentProcessor" 
        but have no idea if that's a class, a file, a folder, or something the model made up.
      </p>
      <p>
        The diagram becomes a poster. Nice to glance at once, then forgotten.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The fix
      </h2>
      <p>
        Ground every node in actual code. Each box should map to a file and line range. 
        Now the diagram isn't decoration—it's a navigation surface. Click a node, jump to 
        the code.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The format
      </h2>
      <p>
        There are many ways to represent grounded diagrams. This is one that works well 
        with Claude: the Naiad format. It's a single file containing Mermaid diagram syntax 
        plus a metadata block that maps node IDs to code locations.
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`flowchart TD
    auth[AuthService]
    db[DatabaseLayer]
    pay[PaymentProcessor]
    
    auth --> db
    auth --> pay
    pay --> db

---
naiad:
  auth:
    file: src/auth/service.ts
    lines: [1, 145]
  db:
    file: src/db/index.ts
    lines: [1, 89]
  pay:
    file: src/payments/processor.ts
    lines: [12, 203]`}
      </pre>
      <p>
        The Mermaid renders as a diagram. The YAML block tells you where each node lives. 
        Claude generates this format reliably because it designed it.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The prompt
      </h2>
      <p>
        {/* TODO: Add the actual prompt once we design it */}
        [Prompt coming soon]
      </p>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">
        The viewer
      </h2>
      <p>
        Paste a .naiad file into the viewer and get an interactive diagram with clickable 
        nodes. Each node links to the code location specified in the metadata.
      </p>
      <p>
        {/* TODO: Add viewer link once built */}
        [Viewer link coming soon]
      </p>
    </div>
  );
}

export default DiagrammingAgentPost;
