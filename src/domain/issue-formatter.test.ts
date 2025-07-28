import { assertEquals } from "@std/assert";
import { IssueFormatter } from "./issue-formatter.ts";
import type { Issue } from "../types/issue.ts";

Deno.test("IssueFormatter", async (t) => {
  const formatter = new IssueFormatter();

  await t.step("should format empty list", () => {
    const result = formatter.formatText([]);
    assertEquals(result, "No issues found.");
  });

  await t.step("should format single issue", () => {
    const issue: Issue = {
      id: "issue-1",
      title: "Test Issue",
      status: "plan",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = formatter.formatText([issue]);
    assertEquals(result, "📋 issue-1 Test Issue");
  });

  await t.step("should format hierarchical issues with indentation", () => {
    const parent: Issue = {
      id: "parent-1",
      title: "Parent Issue",
      status: "backlog",
      childIds: ["child-1", "child-2"],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const child1: Issue = {
      id: "child-1",
      title: "First Child",
      status: "in_progress",
      parentId: "parent-1",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const child2: Issue = {
      id: "child-2",
      title: "Second Child",
      status: "plan",
      parentId: "parent-1",
      childIds: ["grandchild-1"],
      dependsOn: ["child-1"],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const grandchild: Issue = {
      id: "grandchild-1",
      title: "Grandchild",
      status: "plan",
      parentId: "child-2",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const issues = [parent, child1, child2, grandchild];
    const result = formatter.formatText(issues);
    
    const expectedLines = [
      "📌 parent-1 Parent Issue",
      "  └─ 🔄 child-1 First Child",
      "  └─ 📋 child-2 Second Child (depends on: child-1)",
      "    └─ 📋 grandchild-1 Grandchild",
    ];
    
    assertEquals(result, expectedLines.join("\n"));
  });

  await t.step("should format multiple root issues", () => {
    const root1: Issue = {
      id: "root-1",
      title: "First Root",
      status: "done",
      childIds: ["child-1"],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const child1: Issue = {
      id: "child-1",
      title: "Child of First",
      status: "done",
      parentId: "root-1",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const root2: Issue = {
      id: "root-2",
      title: "Second Root",
      status: "in_review",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const issues = [root2, child1, root1]; // Mixed order
    const result = formatter.formatText(issues);
    
    const expectedLines = [
      "✅ root-1 First Root",
      "  └─ ✅ child-1 Child of First",
      "🔍 root-2 Second Root",
    ];
    
    assertEquals(result, expectedLines.join("\n"));
  });

  await t.step("should show agent assignment", () => {
    const issue: Issue = {
      id: "agent-issue",
      title: "Assigned Issue",
      status: "in_progress",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      agentName: "agent-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = formatter.formatText([issue]);
    assertEquals(result, "🔄 agent-issue Assigned Issue [agent-1]");
  });

  await t.step("should format tree view", () => {
    const parent: Issue = {
      id: "parent-1",
      title: "Parent",
      status: "backlog",
      childIds: ["child-1", "child-2"],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const child1: Issue = {
      id: "child-1",
      title: "First Child",
      status: "plan",
      parentId: "parent-1",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const child2: Issue = {
      id: "child-2",
      title: "Second Child",
      status: "plan",
      parentId: "parent-1",
      childIds: [],
      dependsOn: ["child-1"],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const issues = [parent, child1, child2];
    const result = formatter.formatTree(issues);
    
    const expectedLines = [
      "└── 📌 Parent",
      "    ├── 📋 First Child",
      "    └── 📋 Second Child (→ 1)",
    ];
    
    assertEquals(result, expectedLines.join("\n"));
  });

  await t.step("should format JSON", () => {
    const issue: Issue = {
      id: "json-issue",
      title: "JSON Test",
      status: "plan",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    const result = formatter.formatJson([issue]);
    const parsed = JSON.parse(result);
    
    assertEquals(Array.isArray(parsed), true);
    assertEquals(parsed.length, 1);
    assertEquals(parsed[0].id, "json-issue");
    assertEquals(parsed[0].title, "JSON Test");
  });
});