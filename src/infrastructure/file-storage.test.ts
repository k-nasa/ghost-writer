import { assertEquals, assertRejects, assertExists } from "@std/assert";
import { FileBasedStorage } from "./file-storage.ts";
import type { Issue } from "../types/issue.ts";
import { StorageError } from "../types/errors.ts";
import { join } from "@std/path";
import { exists } from "@std/fs";

const TEST_DIR = await Deno.makeTempDir();

Deno.test("FileBasedStorage", async (t) => {
  await t.step("should initialize storage directories", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    const issuesDir = await Deno.stat(`${TEST_DIR}/.ghost/issues`);
    assertEquals(issuesDir.isDirectory, true);
    
    const agentsFile = await Deno.readTextFile(`${TEST_DIR}/.ghost/agents.json`);
    const agents = JSON.parse(agentsFile);
    assertEquals(agents.maxAgents, 10);
  });

  await t.step("should save and retrieve issues with file structure", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    const issue: Issue = {
      id: "test-issue-1",
      title: "Test Issue",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(issue);
    
    // Check file structure
    const issuePath = join(TEST_DIR, ".ghost", "issues", "test-issue-1", "issue.json");
    assertExists(await Deno.stat(issuePath));
    
    const retrieved = await storage.getIssue("test-issue-1");
    assertEquals(retrieved?.id, "test-issue-1");
    assertEquals(retrieved?.title, "Test Issue");
    assertEquals(retrieved?.status, "plan");
  });

  await t.step("should handle hierarchical issues", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    // Create parent issue
    const parentIssue: Issue = {
      id: "parent-issue",
      title: "Parent Issue",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(parentIssue);
    
    // Create child issue
    const childIssue: Issue = {
      id: "child-issue",
      title: "Child Issue",
      status: "plan",
      parentId: "parent-issue",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(childIssue);
    
    // Check file structure - child should be under parent directory
    const childPath = join(TEST_DIR, ".ghost", "issues", "parent-issue", "child-issue", "issue.json");
    assertExists(await Deno.stat(childPath));
    
    // Retrieve and verify
    const retrievedChild = await storage.getIssue("child-issue");
    assertEquals(retrievedChild?.parentId, "parent-issue");
  });

  await t.step("should update issues", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    const issue: Issue = {
      id: "test-issue-2",
      title: "Original Title",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(issue);
    await storage.updateIssue("test-issue-2", {
      title: "Updated Title",
      status: "backlog",
    });
    
    const updated = await storage.getIssue("test-issue-2");
    assertEquals(updated?.title, "Updated Title");
    assertEquals(updated?.status, "backlog");
  });

  await t.step("should move issue when parent changes", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    // Create two parent issues
    const parent1: Issue = {
      id: "parent-1",
      title: "Parent 1",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const parent2: Issue = {
      id: "parent-2",
      title: "Parent 2",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(parent1);
    await storage.saveIssue(parent2);
    
    // Create child under parent1
    const child: Issue = {
      id: "movable-child",
      title: "Movable Child",
      status: "plan",
      parentId: "parent-1",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(child);
    
    // Verify initial location
    const oldPath = join(TEST_DIR, ".ghost", "issues", "parent-1", "movable-child", "issue.json");
    assertEquals(await exists(oldPath), true);
    
    // Move to parent2
    await storage.updateIssue("movable-child", { parentId: "parent-2" });
    
    // Verify new location
    const newPath = join(TEST_DIR, ".ghost", "issues", "parent-2", "movable-child", "issue.json");
    assertEquals(await exists(newPath), true);
    assertEquals(await exists(oldPath), false);
  });

  await t.step("should delete issues", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    const issue: Issue = {
      id: "test-issue-3",
      title: "To Delete",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(issue);
    await storage.deleteIssue("test-issue-3");
    
    const deleted = await storage.getIssue("test-issue-3");
    assertEquals(deleted, null);
    
    // Verify file is deleted
    const issuePath = join(TEST_DIR, ".ghost", "issues", "test-issue-3", "issue.json");
    assertEquals(await exists(issuePath), false);
  });

  await t.step("should prevent deleting issues with children", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    // Create parent with child
    const parent: Issue = {
      id: "parent-with-child",
      title: "Parent",
      status: "plan",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const child: Issue = {
      id: "child-of-parent",
      title: "Child",
      status: "plan",
      parentId: "parent-with-child",
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await storage.saveIssue(parent);
    await storage.saveIssue(child);
    
    await assertRejects(
      async () => {
        await storage.deleteIssue("parent-with-child");
      },
      StorageError,
      "Cannot delete issue parent-with-child: it has child issues",
    );
  });

  await t.step("should get all issues", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    const allIssues = await storage.getIssues();
    // Should have all issues created in previous tests
    assertEquals(allIssues.length > 0, true);
    
    // Check that hierarchical issues are included
    const hasParent = allIssues.some(i => i.id === "parent-issue");
    const hasChild = allIssues.some(i => i.id === "child-issue");
    assertEquals(hasParent, true);
    assertEquals(hasChild, true);
  });

  await t.step("should throw error when updating non-existent issue", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    await assertRejects(
      async () => {
        await storage.updateIssue("non-existent", { title: "New Title" });
      },
      StorageError,
      "Issue not found: non-existent",
    );
  });

  await t.step("should throw error when deleting non-existent issue", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    await assertRejects(
      async () => {
        await storage.deleteIssue("non-existent");
      },
      StorageError,
      "Issue not found: non-existent",
    );
  });

  await t.step("should handle agent registry", async () => {
    const storage = new FileBasedStorage(TEST_DIR);
    await storage.init();
    
    const registry = await storage.getAgentRegistry();
    assertEquals(registry.maxAgents, 10);
    
    registry.agents["agent1"] = {
      name: "agent1",
      status: "idle",
    };
    
    await storage.saveAgentRegistry(registry);
    
    const saved = await storage.getAgentRegistry();
    assertEquals(saved.agents["agent1"].name, "agent1");
    assertEquals(saved.agents["agent1"].status, "idle");
  });
});

// Cleanup
Deno.test("cleanup", () => {
  Deno.removeSync(TEST_DIR, { recursive: true });
});