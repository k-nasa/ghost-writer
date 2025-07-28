import { assertEquals } from "@std/assert";

// Helper function to detect circular dependencies
function detectCircularDependency(
  from: string,
  to: string,
  dependencies: Map<string, Set<string>>
): boolean {
  // Check if adding from -> to would create a cycle
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  // First, add the proposed dependency temporarily
  if (!dependencies.has(from)) {
    dependencies.set(from, new Set());
  }
  const fromDeps = dependencies.get(from)!;
  const hadDependency = fromDeps.has(to);
  fromDeps.add(to);
  
  // DFS to detect cycle
  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    
    const deps = dependencies.get(node) || new Set();
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (hasCycle(dep)) return true;
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  const result = hasCycle(from);
  
  // Remove the temporary dependency if it wasn't there before
  if (!hadDependency) {
    fromDeps.delete(to);
  }
  
  return result;
}

Deno.test("Complex dependency - diamond pattern", () => {
  const deps = new Map<string, Set<string>>();
  
  // Create diamond: A depends on B and C, both B and C depend on D
  deps.set("A", new Set(["B", "C"]));
  deps.set("B", new Set(["D"]));
  deps.set("C", new Set(["D"]));
  deps.set("D", new Set());
  
  // No cycles in diamond
  assertEquals(detectCircularDependency("D", "E", deps), false);
  
  // Adding D -> A would create cycle
  assertEquals(detectCircularDependency("D", "A", deps), true);
});

Deno.test("Complex dependency - long chain", () => {
  const deps = new Map<string, Set<string>>();
  
  // Create chain: A -> B -> C -> D -> E
  deps.set("A", new Set(["B"]));
  deps.set("B", new Set(["C"]));
  deps.set("C", new Set(["D"]));
  deps.set("D", new Set(["E"]));
  deps.set("E", new Set());
  
  // No cycle in chain
  assertEquals(detectCircularDependency("E", "F", deps), false);
  
  // E -> A would create cycle
  assertEquals(detectCircularDependency("E", "A", deps), true);
  
  // E -> C would also create cycle
  assertEquals(detectCircularDependency("E", "C", deps), true);
});

Deno.test("Complex dependency - multiple paths", () => {
  const deps = new Map<string, Set<string>>();
  
  // Multiple paths: A has two paths to D
  // A -> B -> D
  // A -> C -> D
  deps.set("A", new Set(["B", "C"]));
  deps.set("B", new Set(["D"]));
  deps.set("C", new Set(["D"]));
  deps.set("D", new Set());
  
  // No cycles
  assertEquals(detectCircularDependency("B", "E", deps), false);
  assertEquals(detectCircularDependency("C", "E", deps), false);
  
  // D -> A creates cycle through both paths
  assertEquals(detectCircularDependency("D", "A", deps), true);
  assertEquals(detectCircularDependency("D", "B", deps), true);
  assertEquals(detectCircularDependency("D", "C", deps), true);
});

Deno.test("Complex dependency - self reference", () => {
  const deps = new Map<string, Set<string>>();
  deps.set("A", new Set());
  
  // Self-reference is always circular
  assertEquals(detectCircularDependency("A", "A", deps), true);
});

Deno.test("Complex dependency - disconnected graphs", () => {
  const deps = new Map<string, Set<string>>();
  
  // Two disconnected dependency graphs
  // Graph 1: A -> B -> C
  deps.set("A", new Set(["B"]));
  deps.set("B", new Set(["C"]));
  deps.set("C", new Set());
  
  // Graph 2: X -> Y -> Z
  deps.set("X", new Set(["Y"]));
  deps.set("Y", new Set(["Z"]));
  deps.set("Z", new Set());
  
  // No cycles between disconnected graphs
  assertEquals(detectCircularDependency("C", "X", deps), false);
  assertEquals(detectCircularDependency("Z", "A", deps), false);
  
  // But cycles within each graph
  assertEquals(detectCircularDependency("C", "A", deps), true);
  assertEquals(detectCircularDependency("Z", "X", deps), true);
});