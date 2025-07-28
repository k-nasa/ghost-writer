import { assertEquals, assert } from "@std/assert";
import {
  canTransitionTo,
  generateIssueId,
  validateIssueHierarchyDepth,
} from "./issue.ts";

Deno.test("canTransitionTo", async (t) => {
  await t.step("should allow all transitions", () => {
    // All transitions are allowed now
    assert(canTransitionTo("plan", "backlog"));
    assert(canTransitionTo("plan", "in_progress"));
    assert(canTransitionTo("plan", "done"));
    assert(canTransitionTo("plan", "in_review"));
    assert(canTransitionTo("plan", "archived"));
    
    assert(canTransitionTo("backlog", "plan"));
    assert(canTransitionTo("backlog", "in_progress"));
    assert(canTransitionTo("backlog", "done"));
    assert(canTransitionTo("backlog", "in_review"));
    assert(canTransitionTo("backlog", "archived"));
    
    assert(canTransitionTo("in_progress", "plan"));
    assert(canTransitionTo("in_progress", "backlog"));
    assert(canTransitionTo("in_progress", "done"));
    assert(canTransitionTo("in_progress", "in_review"));
    assert(canTransitionTo("in_progress", "archived"));
    
    assert(canTransitionTo("in_review", "plan"));
    assert(canTransitionTo("in_review", "backlog"));
    assert(canTransitionTo("in_review", "in_progress"));
    assert(canTransitionTo("in_review", "done"));
    assert(canTransitionTo("in_review", "archived"));
    
    assert(canTransitionTo("done", "plan"));
    assert(canTransitionTo("done", "backlog"));
    assert(canTransitionTo("done", "in_progress"));
    assert(canTransitionTo("done", "in_review"));
    assert(canTransitionTo("done", "archived"));
    
    assert(canTransitionTo("archived", "plan"));
    assert(canTransitionTo("archived", "backlog"));
    assert(canTransitionTo("archived", "in_progress"));
    assert(canTransitionTo("archived", "in_review"));
    assert(canTransitionTo("archived", "done"));
  });
});

Deno.test("validateIssueHierarchyDepth", async (t) => {
  await t.step("should allow issues without parent", () => {
    assert(validateIssueHierarchyDepth(undefined));
  });

  await t.step("should allow depth up to 4 levels", () => {
    assert(validateIssueHierarchyDepth("issue1"));
    assert(validateIssueHierarchyDepth("issue1.issue2"));
    assert(validateIssueHierarchyDepth("issue1.issue2.issue3"));
  });

  await t.step("should disallow depth beyond 4 levels", () => {
    assert(!validateIssueHierarchyDepth("issue1.issue2.issue3.issue4"));
    assert(!validateIssueHierarchyDepth("a.b.c.d.e"));
  });
});

Deno.test("generateIssueId", async (t) => {
  await t.step("should generate unique IDs", () => {
    const id1 = generateIssueId();
    const id2 = generateIssueId();
    
    assert(id1 !== id2);
    assert(id1.includes("-"));
    assert(id2.includes("-"));
  });

  await t.step("should append to parent ID when provided", () => {
    const parentId = "parent123";
    const childId = generateIssueId(parentId);
    
    assert(childId.startsWith(parentId + "."));
    assertEquals(childId.split(".")[0], parentId);
  });

  await t.step("should generate hierarchical IDs", () => {
    const rootId = generateIssueId();
    const childId = generateIssueId(rootId);
    const grandchildId = generateIssueId(childId);
    
    assert(childId.startsWith(rootId + "."));
    assert(grandchildId.startsWith(childId + "."));
    assertEquals(grandchildId.split(".").length, 3);
  });
});