import { assertEquals, assertRejects } from "@std/assert";
import { IssueService } from "./issue-service.ts";
import { DependencyError } from "../types/errors.ts";
import type { Issue } from "../types/issue.ts";

const TEST_DIR = await Deno.makeTempDir();

Deno.test("Dependency Management", async (t) => {
  await t.step("should detect simple circular dependency", async () => {
    const service = new IssueService();
    
    // Create two issues
    const issue1 = await service.createIssue({
      title: "Issue 1",
    });
    
    const issue2 = await service.createIssue({
      title: "Issue 2",
    });
    
    // Add dependency: issue1 → issue2
    await service.addDependency(issue1.id, issue2.id);
    
    // Try to add reverse dependency: issue2 → issue1 (should fail)
    await assertRejects(
      async () => {
        await service.addDependency(issue2.id, issue1.id);
      },
      DependencyError,
      "Circular dependency detected:",
    );
  });

  await t.step("should detect multi-level circular dependency", async () => {
    const service = new IssueService();
    
    // Create three issues
    const issue1 = await service.createIssue({
      title: "Issue 1",
    });
    
    const issue2 = await service.createIssue({
      title: "Issue 2", 
    });
    
    const issue3 = await service.createIssue({
      title: "Issue 3",
    });
    
    // Create chain: issue1 → issue2 → issue3
    await service.addDependency(issue1.id, issue2.id);
    await service.addDependency(issue2.id, issue3.id);
    
    // Try to close the loop: issue3 → issue1 (should fail)
    await assertRejects(
      async () => {
        await service.addDependency(issue3.id, issue1.id);
      },
      DependencyError,
      "Circular dependency detected",
    );
  });

  await t.step("should allow parallel dependencies", async () => {
    const service = new IssueService();
    
    // Create four issues
    const base = await service.createIssue({
      title: "Base",
    });
    
    const dep1 = await service.createIssue({
      title: "Dependency 1",
    });
    
    const dep2 = await service.createIssue({
      title: "Dependency 2",
    });
    
    const final = await service.createIssue({
      title: "Final",
    });
    
    // Create diamond shape (should be allowed)
    // base → dep1 → final
    // base → dep2 → final
    await service.addDependency(base.id, dep1.id);
    await service.addDependency(base.id, dep2.id);
    await service.addDependency(dep1.id, final.id);
    await service.addDependency(dep2.id, final.id);
    
    // Verify dependencies
    const updatedBase = await service.getIssue(base.id);
    assertEquals(updatedBase?.dependsOn.length, 2);
    
    const updatedFinal = await service.getIssue(final.id);
    assertEquals(updatedFinal?.dependedBy.length, 2);
  });

  await t.step("should handle available issues correctly", async () => {
    const service = new IssueService();
    
    // Create issues with dependencies
    const task1 = await service.createIssue({
      title: "Task 1",
    });
    await service.updateIssueStatus(task1.id, "backlog");
    
    const task2 = await service.createIssue({
      title: "Task 2",
    });
    await service.updateIssueStatus(task2.id, "backlog");
    
    const task3 = await service.createIssue({
      title: "Task 3",
    });
    await service.updateIssueStatus(task3.id, "backlog");
    
    // Add dependency: task3 depends on task2
    await service.addDependency(task3.id, task2.id);
    
    // Get available issues
    let available = await service.getAvailableIssues();
    let availableIds = available.map(i => i.id);
    
    // task1 and task2 should be available, but not task3
    assertEquals(availableIds.includes(task1.id), true);
    assertEquals(availableIds.includes(task2.id), true);
    assertEquals(availableIds.includes(task3.id), false);
    
    // Complete task2
    await service.updateIssueStatus(task2.id, "in_progress");
    await service.updateIssueStatus(task2.id, "done");
    
    // Now task3 should also be available
    available = await service.getAvailableIssues();
    availableIds = available.map(i => i.id);
    
    assertEquals(availableIds.includes(task1.id), true);
    assertEquals(availableIds.includes(task3.id), true);
    assertEquals(availableIds.includes(task2.id), false); // task2 is done
  });

  await t.step("should remove dependencies correctly", async () => {
    const service = new IssueService();
    
    const issue1 = await service.createIssue({
      title: "Issue 1",
    });
    
    const issue2 = await service.createIssue({
      title: "Issue 2",
    });
    
    // Add dependency
    await service.addDependency(issue1.id, issue2.id);
    
    // Verify dependency exists
    let updated1 = await service.getIssue(issue1.id);
    assertEquals(updated1?.dependsOn, [issue2.id]);
    
    // Remove dependency
    await service.removeDependency(issue1.id, issue2.id);
    
    // Verify dependency removed
    updated1 = await service.getIssue(issue1.id);
    assertEquals(updated1?.dependsOn, []);
    
    const updated2 = await service.getIssue(issue2.id);
    assertEquals(updated2?.dependedBy, []);
  });
});

// Cleanup
Deno.test("cleanup", () => {
  Deno.removeSync(TEST_DIR, { recursive: true });
});