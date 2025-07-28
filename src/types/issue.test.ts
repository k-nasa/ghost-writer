import { assertEquals, assert } from "@std/assert";
import {
  canTransitionTo,
  generateIssueId,
  validateIssueHierarchyDepth,
} from "./issue.ts";

Deno.test("canTransitionTo", async (t) => {
  await t.step("should allow valid transitions", () => {
    assert(canTransitionTo("plan", "backlog"));
    assert(canTransitionTo("plan", "cancelled"));
    assert(canTransitionTo("backlog", "in_progress"));
    assert(canTransitionTo("backlog", "cancelled"));
    assert(canTransitionTo("in_progress", "done"));
    assert(canTransitionTo("in_progress", "cancelled"));
  });

  await t.step("should disallow invalid transitions", () => {
    assert(!canTransitionTo("plan", "in_progress"));
    assert(!canTransitionTo("plan", "done"));
    assert(!canTransitionTo("backlog", "done"));
    assert(!canTransitionTo("done", "cancelled"));
    assert(!canTransitionTo("cancelled", "done"));
  });

  await t.step("should disallow transitions from terminal states", () => {
    assert(!canTransitionTo("done", "plan"));
    assert(!canTransitionTo("done", "backlog"));
    assert(!canTransitionTo("cancelled", "plan"));
    assert(!canTransitionTo("cancelled", "backlog"));
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