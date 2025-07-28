import { ensureDir, exists, walk } from "@std/fs";
import { join, dirname } from "@std/path";
import type { Issue } from "../types/issue.ts";
import type { Agent, AgentRegistry } from "../types/agent.ts";
import { StorageError } from "../types/errors.ts";
import type { Storage } from "./storage.ts";
import { LRUCache } from "./cache.ts";

const GHOST_DIR = ".ghost";
const ISSUES_DIR = join(GHOST_DIR, "issues");
const AGENTS_FILE = join(GHOST_DIR, "agents.json");
const ISSUE_FILE_NAME = "issue.json";

export class FileBasedStorage implements Storage {
  private issueCache: LRUCache<Issue>;
  private issuePathCache: LRUCache<string>;

  constructor(private rootPath: string = Deno.cwd()) {
    this.issueCache = new LRUCache<Issue>(200);
    this.issuePathCache = new LRUCache<string>(200);
  }

  private get issuesPath(): string {
    return join(this.rootPath, ISSUES_DIR);
  }

  private get agentsPath(): string {
    return join(this.rootPath, AGENTS_FILE);
  }

  async init(): Promise<void> {
    await ensureDir(this.issuesPath);
    
    if (!await exists(this.agentsPath)) {
      const defaultRegistry: AgentRegistry = {
        agents: {},
        maxAgents: 10,
      };
      await Deno.writeTextFile(this.agentsPath, JSON.stringify(defaultRegistry, null, 2));
    }
  }

  async getIssues(): Promise<Issue[]> {
    try {
      const issues: Issue[] = [];
      
      for await (const entry of walk(this.issuesPath, {
        includeFiles: true,
        includeDirs: false,
        match: [new RegExp(`${ISSUE_FILE_NAME}$`)],
      })) {
        const content = await Deno.readTextFile(entry.path);
        const issue = this.parseIssue(JSON.parse(content));
        issues.push(issue);
      }
      
      return issues;
    } catch (error) {
      throw new StorageError(`Failed to read issues: ${error.message}`);
    }
  }

  async getIssue(id: string): Promise<Issue | null> {
    // Check cache first
    const cached = this.issueCache.get(id);
    if (cached) {
      return cached;
    }

    try {
      const issuePath = await this.findIssuePath(id);
      if (!issuePath) return null;
      
      const content = await Deno.readTextFile(issuePath);
      const issue = this.parseIssue(JSON.parse(content));
      
      // Cache the issue
      this.issueCache.set(id, issue);
      
      return issue;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }
      throw new StorageError(`Failed to read issue ${id}: ${error.message}`);
    }
  }

  async saveIssue(issue: Issue): Promise<void> {
    try {
      const issuePath = await this.determineIssuePath(issue);
      await ensureDir(dirname(issuePath));
      
      await Deno.writeTextFile(
        issuePath,
        JSON.stringify(this.serializeIssue(issue), null, 2)
      );
      
      // Update cache
      this.issueCache.set(issue.id, issue);
      this.issuePathCache.set(issue.id, issuePath);
    } catch (error) {
      throw new StorageError(`Failed to save issue: ${error.message}`);
    }
  }

  async updateIssue(id: string, updates: Partial<Issue>): Promise<void> {
    try {
      const issue = await this.getIssue(id);
      if (!issue) {
        throw new StorageError(`Issue not found: ${id}`);
      }
      
      const updatedIssue = {
        ...issue,
        ...updates,
        updatedAt: new Date(),
      };
      
      // If parentId changed, we need to move the file
      if (updates.parentId !== undefined && updates.parentId !== issue.parentId) {
        const oldPath = await this.findIssuePath(id);
        if (oldPath) {
          await Deno.remove(oldPath);
          // Clear path cache as location changed
          this.issuePathCache.delete(id);
        }
      }
      
      await this.saveIssue(updatedIssue);
    } catch (error) {
      throw new StorageError(`Failed to update issue: ${error.message}`);
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      const issuePath = await this.findIssuePath(id);
      if (!issuePath) {
        throw new StorageError(`Issue not found: ${id}`);
      }
      
      // Check if issue has children
      const issueDir = dirname(issuePath);
      const hasChildren = await this.hasChildIssues(issueDir);
      
      if (hasChildren) {
        throw new StorageError(`Cannot delete issue ${id}: it has child issues`);
      }
      
      // Remove the issue file
      await Deno.remove(issuePath);
      
      // Remove from cache
      this.issueCache.delete(id);
      this.issuePathCache.delete(id);
      
      // Remove the directory if it's empty
      try {
        await Deno.remove(issueDir);
      } catch {
        // Directory not empty or is the root issues directory
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to delete issue: ${error.message}`);
    }
  }

  async getAgentRegistry(): Promise<AgentRegistry> {
    try {
      const content = await Deno.readTextFile(this.agentsPath);
      const registry = JSON.parse(content);
      
      // Convert dates in agents
      for (const agent of Object.values(registry.agents) as Agent[]) {
        if (agent.startedAt) {
          agent.startedAt = new Date(agent.startedAt as any);
        }
      }
      
      return registry;
    } catch (error) {
      throw new StorageError(`Failed to read agent registry: ${error.message}`);
    }
  }

  async saveAgentRegistry(registry: AgentRegistry): Promise<void> {
    try {
      await Deno.writeTextFile(this.agentsPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      throw new StorageError(`Failed to save agent registry: ${error.message}`);
    }
  }

  private async determineIssuePath(issue: Issue): Promise<string> {
    let basePath = this.issuesPath;
    
    // If issue has a parent, find the parent's directory
    if (issue.parentId) {
      const parentPath = await this.findIssuePath(issue.parentId);
      if (!parentPath) {
        throw new StorageError(`Parent issue not found: ${issue.parentId}`);
      }
      basePath = dirname(parentPath);
    }
    
    return join(basePath, issue.id, ISSUE_FILE_NAME);
  }

  private async findIssuePath(id: string): Promise<string | null> {
    // Check cache first
    const cached = this.issuePathCache.get(id);
    if (cached) {
      // Verify the path still exists
      if (await exists(cached)) {
        return cached;
      }
      // Invalid cache entry, remove it
      this.issuePathCache.delete(id);
    }

    for await (const entry of walk(this.issuesPath, {
      includeFiles: false,
      includeDirs: true,
    })) {
      if (entry.name === id) {
        const issuePath = join(entry.path, ISSUE_FILE_NAME);
        if (await exists(issuePath)) {
          // Cache the path
          this.issuePathCache.set(id, issuePath);
          return issuePath;
        }
      }
    }
    return null;
  }

  private async hasChildIssues(dirPath: string): Promise<boolean> {
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isDirectory) {
        const childIssuePath = join(dirPath, entry.name, ISSUE_FILE_NAME);
        if (await exists(childIssuePath)) {
          return true;
        }
      }
    }
    return false;
  }

  private parseIssue(data: any): Issue {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : undefined,
    };
  }

  private serializeIssue(issue: Issue): any {
    return {
      ...issue,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      startedAt: issue.startedAt?.toISOString(),
      completedAt: issue.completedAt?.toISOString(),
      cancelledAt: issue.cancelledAt?.toISOString(),
    };
  }
}