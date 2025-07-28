import { assertEquals, assertNotEquals, assertRejects, assertExists } from "@std/assert";
import { IssueService } from "./issue-service.ts";
import { FileStorage } from "../infrastructure/storage.ts";
import {
  CircularDependencyError,
  InvalidStateTransitionError,
  IssueNotFoundError,
  MaxDepthExceededError,
  DependencyError,
} from "../types/errors.ts";

const TEST_DIR = await Deno.makeTempDir();

async function setupTestService(): Promise<IssueService> {
  const storage = new FileStorage(TEST_DIR);
  await storage.init();
  return new IssueService();
}

Deno.test("IssueService", async (t) => {
  await t.step("should create issue with default values", async () => {
    const service = await setupTestService();
    
    const issue = await service.createIssue({
      title: "Test Issue",
    });
    
    assertExists(issue.id);
    assertEquals(issue.title, "Test Issue");
    assertEquals(issue.status, "plan");
    assertEquals(issue.childIds.length, 0);
    assertEquals(issue.dependsOn.length, 0);
  });

  await t.step("should create issue with parent", async () => {
    const service = await setupTestService();
    
    const parent = await service.createIssue({
      title: "Parent Issue",
    });
    
    const child = await service.createIssue({
      title: "Child Issue",
      parentId: parent.id,
    });
    
    assertEquals(child.parentId, parent.id);
    assertEquals(child.id.startsWith(parent.id + "."), true);
    
    // Check parent was updated
    const updatedParent = await service.getIssue(parent.id);
    assertEquals(updatedParent?.childIds.includes(child.id), true);
  });

  await t.step("should enforce hierarchy depth limit", async () => {
    const service = await setupTestService();
    
    const level1 = await service.createIssue({ title: "Level 1" });
    const level2 = await service.createIssue({
      title: "Level 2",
      parentId: level1.id,
    });
    const level3 = await service.createIssue({
      title: "Level 3",
      parentId: level2.id,
    });
    const level4 = await service.createIssue({
      title: "Level 4",
      parentId: level3.id,
    });
    
    // Should fail at level 5
    await assertRejects(
      async () => {
        await service.createIssue({
          title: "Level 5",
          parentId: level4.id,
        });
      },
      MaxDepthExceededError,
    );
  });

  await t.step("should update issue status with valid transitions", async () => {
    const service = await setupTestService();
    
    const issue = await service.createIssue({ title: "Test Issue" });
    
    // plan -> backlog
    let updated = await service.updateIssueStatus(issue.id, "backlog");
    assertEquals(updated.status, "backlog");
    
    // backlog -> in_progress
    updated = await service.updateIssueStatus(issue.id, "in_progress");
    assertEquals(updated.status, "in_progress");
    assertExists(updated.startedAt);
    
    // in_progress -> done
    updated = await service.updateIssueStatus(issue.id, "done");
    assertEquals(updated.status, "done");
    assertExists(updated.completedAt);
  });

  await t.step("should reject invalid status transitions", async () => {
    const service = await setupTestService();
    
    const issue = await service.createIssue({ title: "Test Issue" });
    
    await assertRejects(
      async () => {
        await service.updateIssueStatus(issue.id, "done");
      },
      InvalidStateTransitionError,
    );
  });

  await t.step("should add and remove dependencies", async () => {
    const service = await setupTestService();
    
    const issue1 = await service.createIssue({ title: "Issue 1" });
    const issue2 = await service.createIssue({ title: "Issue 2" });
    
    await service.addDependency(issue1.id, issue2.id);
    
    const updated1 = await service.getIssue(issue1.id);
    const updated2 = await service.getIssue(issue2.id);
    
    assertEquals(updated1?.dependsOn?.includes(issue2.id), true);
    assertEquals(updated2?.dependedBy?.includes(issue1.id), true);
    
    // Remove dependency
    await service.removeDependency(issue1.id, issue2.id);
    
    const removed1 = await service.getIssue(issue1.id);
    const removed2 = await service.getIssue(issue2.id);
    
    assertEquals(removed1?.dependsOn.includes(issue2.id), false);
    assertEquals(removed2?.dependedBy.includes(issue1.id), false);
  });

  await t.step("should detect circular dependencies", async () => {
    const service = await setupTestService();
    
    const issue1 = await service.createIssue({ title: "Issue 1" });
    const issue2 = await service.createIssue({ title: "Issue 2" });
    const issue3 = await service.createIssue({ title: "Issue 3" });
    
    await service.addDependency(issue1.id, issue2.id);
    await service.addDependency(issue2.id, issue3.id);
    
    // Should detect circular dependency
    await assertRejects(
      async () => {
        await service.addDependency(issue3.id, issue1.id);
      },
      DependencyError,
    );
  });

  await t.step("should filter issues by status", async () => {
    const service = await setupTestService();
    
    const issue1 = await service.createIssue({ title: "Plan Issue" });
    const issue2 = await service.createIssue({ title: "Backlog Issue" });
    await service.updateIssueStatus(issue2.id, "backlog");
    
    const planIssues = await service.getIssues({ status: ["plan"] });
    const backlogIssues = await service.getIssues({ status: ["backlog"] });
    
    assertEquals(planIssues.some(i => i.id === issue1.id), true);
    assertEquals(planIssues.some(i => i.id === issue2.id), false);
    assertEquals(backlogIssues.some(i => i.id === issue2.id), true);
  });

  await t.step("should get available issues", async () => {
    const service = await setupTestService();
    
    // Clean up any existing issues
    const storage = new FileStorage(TEST_DIR);
    await storage.init();
    
    const issue1 = await service.createIssue({ title: "Dependency" });
    const issue2 = await service.createIssue({ title: "Dependent" });
    
    await service.updateIssueStatus(issue1.id, "backlog");
    await service.updateIssueStatus(issue2.id, "backlog");
    await service.addDependency(issue2.id, issue1.id);
    
    let available = await service.getAvailableIssues();
    // Filter to only include our test issues
    available = available.filter(i => i.id === issue1.id || i.id === issue2.id);
    assertEquals(available.length, 1);
    assertEquals(available[0].id, issue1.id);
    
    // Complete dependency
    await service.updateIssueStatus(issue1.id, "in_progress");
    await service.updateIssueStatus(issue1.id, "done");
    
    available = await service.getAvailableIssues();
    // Filter to only include our test issues
    available = available.filter(i => i.id === issue1.id || i.id === issue2.id);
    assertEquals(available.length, 1);
    assertEquals(available[0].id, issue2.id);
  });
});

// Cleanup
Deno.test("cleanup", () => {
  Deno.removeSync(TEST_DIR, { recursive: true });
});