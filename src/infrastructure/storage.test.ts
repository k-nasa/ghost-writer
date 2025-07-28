import { assertEquals, assertRejects } from "@std/assert";
import { FileStorage } from "./storage.ts";
import type { Issue } from "../types/issue.ts";
import { StorageError } from "../types/errors.ts";

const TEST_DIR = await Deno.makeTempDir();

Deno.test("FileStorage", async (t) => {
  await t.step("should initialize storage directories", async () => {
    const storage = new FileStorage(TEST_DIR);
    await storage.init();
    
    const dataDir = await Deno.stat(`${TEST_DIR}/.ghost/data`);
    assertEquals(dataDir.isDirectory, true);
    
    const issuesFile = await Deno.readTextFile(`${TEST_DIR}/.ghost/data/issues.json`);
    assertEquals(issuesFile, "[]");
    
    const agentsFile = await Deno.readTextFile(`${TEST_DIR}/.ghost/data/agents.json`);
    const agents = JSON.parse(agentsFile);
    assertEquals(agents.maxAgents, 10);
  });

  await t.step("should save and retrieve issues", async () => {
    const storage = new FileStorage(TEST_DIR);
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
    
    const retrieved = await storage.getIssue("test-issue-1");
    assertEquals(retrieved?.id, "test-issue-1");
    assertEquals(retrieved?.title, "Test Issue");
    assertEquals(retrieved?.status, "plan");
  });

  await t.step("should update issues", async () => {
    const storage = new FileStorage(TEST_DIR);
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

  await t.step("should delete issues", async () => {
    const storage = new FileStorage(TEST_DIR);
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
  });

  await t.step("should throw error when updating non-existent issue", async () => {
    const storage = new FileStorage(TEST_DIR);
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
    const storage = new FileStorage(TEST_DIR);
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
    const storage = new FileStorage(TEST_DIR);
    await storage.init();
    
    const registry = await storage.getAgentRegistry();
    assertEquals(registry.maxAgents, 10);
    assertEquals(Object.keys(registry.agents).length, 0);
    
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