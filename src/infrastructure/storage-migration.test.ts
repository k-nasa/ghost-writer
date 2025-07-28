import { assertEquals, assertExists } from "@std/assert";
import { StorageMigration } from "./storage-migration.ts";
import { LegacyFileStorage } from "./storage.ts";
import { FileBasedStorage } from "./file-storage.ts";
import type { Issue } from "../types/issue.ts";
import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";

const TEST_DIR = await Deno.makeTempDir();

Deno.test("StorageMigration", async (t) => {
  await t.step("should detect when migration is needed", async () => {
    // Create old storage structure
    const oldDataDir = join(TEST_DIR, ".ghost", "data");
    await ensureDir(oldDataDir);
    await Deno.writeTextFile(join(oldDataDir, "issues.json"), "[]");
    
    const migration = new StorageMigration(TEST_DIR);
    assertEquals(await migration.needsMigration(), true);
  });

  await t.step("should migrate issues from old to new format", async () => {
    // Setup old storage with test data
    const oldStorage = new LegacyFileStorage(TEST_DIR);
    await oldStorage.init();
    
    // Create parent issue
    const parentIssue: Issue = {
      id: "parent-1",
      title: "Parent Issue",
      status: "backlog",
      childIds: ["child-1"],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
    
    // Create child issue
    const childIssue: Issue = {
      id: "child-1",
      title: "Child Issue",
      status: "plan",
      parentId: "parent-1",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    };
    
    // Create independent issue
    const independentIssue: Issue = {
      id: "independent-1",
      title: "Independent Issue",
      status: "in_progress",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    };
    
    await oldStorage.saveIssue(parentIssue);
    await oldStorage.saveIssue(childIssue);
    await oldStorage.saveIssue(independentIssue);
    
    // Run migration
    const migration = new StorageMigration(TEST_DIR, oldStorage);
    await migration.migrate();
    
    // Verify new structure
    const newStorage = new FileBasedStorage(TEST_DIR);
    
    // Check parent issue
    const migratedParent = await newStorage.getIssue("parent-1");
    assertEquals(migratedParent?.title, "Parent Issue");
    assertEquals(migratedParent?.status, "backlog");
    
    // Check child issue is in correct location
    const childPath = join(TEST_DIR, ".ghost", "issues", "parent-1", "child-1", "issue.json");
    assertExists(await Deno.stat(childPath));
    
    const migratedChild = await newStorage.getIssue("child-1");
    assertEquals(migratedChild?.title, "Child Issue");
    assertEquals(migratedChild?.parentId, "parent-1");
    
    // Check independent issue
    const independentPath = join(TEST_DIR, ".ghost", "issues", "independent-1", "issue.json");
    assertExists(await Deno.stat(independentPath));
    
    const migratedIndependent = await newStorage.getIssue("independent-1");
    assertEquals(migratedIndependent?.title, "Independent Issue");
    
    // Verify old file was backed up and removed
    const oldIssuesFile = join(TEST_DIR, ".ghost", "data", "issues.json");
    assertEquals(await exists(oldIssuesFile), false);
    
    // Check backup exists
    const backupDir = join(TEST_DIR, ".ghost", "backup");
    assertExists(await Deno.stat(backupDir));
  });

  await t.step("should handle complex hierarchies during migration", async () => {
    const tempDir = await Deno.makeTempDir();
    const oldStorage = new LegacyFileStorage(tempDir);
    await oldStorage.init();
    
    // Create a 3-level hierarchy
    const grandparent: Issue = {
      id: "gp-1",
      title: "Grandparent",
      status: "backlog",
      childIds: ["p-1"],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const parent: Issue = {
      id: "p-1",
      title: "Parent",
      status: "backlog",
      parentId: "gp-1",
      childIds: ["c-1", "c-2"],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const child1: Issue = {
      id: "c-1",
      title: "Child 1",
      status: "plan",
      parentId: "p-1",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const child2: Issue = {
      id: "c-2",
      title: "Child 2",
      status: "plan",
      parentId: "p-1",
      childIds: [],
      dependsOn: ["c-1"],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Save in random order to test sorting
    await oldStorage.saveIssue(child2);
    await oldStorage.saveIssue(grandparent);
    await oldStorage.saveIssue(child1);
    await oldStorage.saveIssue(parent);
    
    // Run migration
    const migration = new StorageMigration(tempDir, oldStorage);
    await migration.migrate();
    
    // Verify structure
    const newStorage = new FileBasedStorage(tempDir);
    
    // Check deep nesting
    const deepPath = join(tempDir, ".ghost", "issues", "gp-1", "p-1", "c-1", "issue.json");
    assertExists(await Deno.stat(deepPath));
    
    const deepPath2 = join(tempDir, ".ghost", "issues", "gp-1", "p-1", "c-2", "issue.json");
    assertExists(await Deno.stat(deepPath2));
    
    // Verify all issues exist and maintain relationships
    const allIssues = await newStorage.getIssues();
    assertEquals(allIssues.length, 4);
    
    const c2 = await newStorage.getIssue("c-2");
    assertEquals(c2?.dependsOn, ["c-1"]);
    
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
  });

  await t.step("should not need migration when already in new format", async () => {
    const tempDir = await Deno.makeTempDir();
    
    // Create new format storage
    const newStorage = new FileBasedStorage(tempDir);
    await newStorage.init();
    
    const issue: Issue = {
      id: "new-format-issue",
      title: "New Format Issue",
      status: "plan",
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await newStorage.saveIssue(issue);
    
    // Migration should not be needed
    const migration = new StorageMigration(tempDir);
    assertEquals(await migration.needsMigration(), false);
    
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
  });
});

// Cleanup
Deno.test("cleanup", () => {
  Deno.removeSync(TEST_DIR, { recursive: true });
});