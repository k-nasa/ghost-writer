import { ensureDir, exists } from "@std/fs";
import { join } from "@std/path";
import type { Issue } from "../types/issue.ts";
import { FileStorage } from "./storage.ts";
import { FileBasedStorage } from "./file-storage.ts";

const OLD_DATA_DIR = join(".ghost", "data");
const OLD_ISSUES_FILE = join(OLD_DATA_DIR, "issues.json");

export class StorageMigration {
  constructor(
    private rootPath: string = Deno.cwd(),
    private oldStorage: FileStorage = new FileStorage(rootPath),
    private newStorage: FileBasedStorage = new FileBasedStorage(rootPath)
  ) {}

  async needsMigration(): Promise<boolean> {
    const oldIssuesPath = join(this.rootPath, OLD_ISSUES_FILE);
    return await exists(oldIssuesPath);
  }

  async migrate(): Promise<void> {
    console.log("Starting storage migration...");
    
    // Initialize new storage
    await this.newStorage.init();
    
    // Get all issues from old storage
    const issues = await this.oldStorage.getIssues();
    console.log(`Found ${issues.length} issues to migrate`);
    
    // Sort issues to ensure parents are created before children
    const sortedIssues = this.sortIssuesByHierarchy(issues);
    
    // Migrate each issue
    for (const issue of sortedIssues) {
      console.log(`Migrating issue: ${issue.id} - ${issue.title}`);
      await this.newStorage.saveIssue(issue);
    }
    
    // Backup old data
    await this.backupOldData();
    
    console.log("Migration completed successfully!");
  }

  private sortIssuesByHierarchy(issues: Issue[]): Issue[] {
    const sorted: Issue[] = [];
    const remaining = [...issues];
    const issueMap = new Map(issues.map(i => [i.id, i]));
    
    while (remaining.length > 0) {
      const batch: Issue[] = [];
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const issue = remaining[i];
        
        // If issue has no parent or parent is already in sorted, it can be added
        if (!issue.parentId || sorted.some(s => s.id === issue.parentId)) {
          batch.push(issue);
          remaining.splice(i, 1);
        }
      }
      
      if (batch.length === 0 && remaining.length > 0) {
        // Circular dependency or orphaned issues
        console.warn("Warning: Found issues with missing parents, adding them anyway");
        sorted.push(...remaining);
        break;
      }
      
      sorted.push(...batch);
    }
    
    return sorted;
  }

  private async backupOldData(): Promise<void> {
    const backupDir = join(this.rootPath, ".ghost", "backup");
    await ensureDir(backupDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = join(backupDir, `issues-${timestamp}.json`);
    
    const oldIssuesPath = join(this.rootPath, OLD_ISSUES_FILE);
    if (await exists(oldIssuesPath)) {
      const content = await Deno.readTextFile(oldIssuesPath);
      await Deno.writeTextFile(backupFile, content);
      console.log(`Old data backed up to: ${backupFile}`);
      
      // Remove old file after successful backup
      await Deno.remove(oldIssuesPath);
    }
  }
}