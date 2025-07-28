import { assertEquals } from "@std/assert";

// Helper function to detect circular dependencies
function detectCircularDependency(
  dependencies: Map<string, Set<string>>,
  start: string,
  target: string,
): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    if (node === target && visited.has(start)) {
      return true;
    }
    
    if (recStack.has(node)) {
      return node === target;
    }
    
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    recStack.add(node);
    
    const deps = dependencies.get(node) || new Set();
    for (const dep of deps) {
      if (dfs(dep)) {
        return true;
      }
    }
    
    recStack.delete(node);
    return false;
  }

  return dfs(start);
}

Deno.test("Complex dependency scenario - detect circular in diamond pattern", () => {
  // Diamond pattern with potential circular path
  const dependencies = new Map<string, Set<string>>([
    ["A", new Set()],
    ["B", new Set(["A"])],
    ["C", new Set(["A"])],
    ["D", new Set(["B", "C"])],
  ]);
  
  // No circular dependency in diamond
  assertEquals(detectCircularDependency(dependencies, "D", "A"), false);
  
  // Adding D -> A would create circular dependency
  dependencies.get("A")!.add("D");
  assertEquals(detectCircularDependency(dependencies, "D", "A"), true);
});

Deno.test("Complex dependency scenario - detect circular in long chain", () => {
  // Long chain: A <- B <- C <- D <- E
  const dependencies = new Map<string, Set<string>>([
    ["A", new Set()],
    ["B", new Set(["A"])],
    ["C", new Set(["B"])],
    ["D", new Set(["C"])],
    ["E", new Set(["D"])],
  ]);
  
  // No circular dependency in chain
  assertEquals(detectCircularDependency(dependencies, "E", "A"), false);
  
  // Adding A -> E would create circular dependency
  assertEquals(detectCircularDependency(dependencies, "A", "E"), true);
});

Deno.test("Complex dependency scenario - multiple independent paths", () => {
  // Two independent paths to same node
  const dependencies = new Map<string, Set<string>>([
    ["A", new Set()],
    ["B", new Set()],
    ["C", new Set(["A"])],
    ["D", new Set(["B"])],
    ["E", new Set(["C", "D"])],
  ]);
  
  // No circular dependencies
  assertEquals(detectCircularDependency(dependencies, "E", "A"), false);
  assertEquals(detectCircularDependency(dependencies, "E", "B"), false);
  
  // Adding circular would be detected
  assertEquals(detectCircularDependency(dependencies, "A", "E"), true);
  assertEquals(detectCircularDependency(dependencies, "B", "E"), true);
});

Deno.test("Complex dependency scenario - self-referential detection", () => {
  const dependencies = new Map<string, Set<string>>([
    ["A", new Set()],
  ]);
  
  // Self-reference is circular
  assertEquals(detectCircularDependency(dependencies, "A", "A"), true);
});