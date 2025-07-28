import { ensureDir, exists } from "@std/fs";
import { join } from "@std/path";
import type { Issue } from "../types/issue.ts";
import type { Agent, AgentRegistry } from "../types/agent.ts";
import { StorageError } from "../types/errors.ts";
import { FileBasedStorage } from "./file-storage.ts";
import { StorageMigration } from "./storage-migration.ts";

const GHOST_DIR = ".ghost";
const DATA_DIR = join(GHOST_DIR, "data");
const ISSUES_FILE = join(DATA_DIR, "issues.json");
const AGENTS_FILE = join(DATA_DIR, "agents.json");

export interface Storage {
  getIssues(): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | null>;
  saveIssue(issue: Issue): Promise<void>;
  updateIssue(id: string, updates: Partial<Issue>): Promise<void>;
  deleteIssue(id: string): Promise<void>;
  getAgentRegistry(): Promise<AgentRegistry>;
  saveAgentRegistry(registry: AgentRegistry): Promise<void>;
}

export class FileStorage implements Storage {
  constructor(private rootPath: string = Deno.cwd()) {}

  private get dataPath(): string {
    return join(this.rootPath, DATA_DIR);
  }

  private get issuesPath(): string {
    return join(this.rootPath, ISSUES_FILE);
  }

  private get agentsPath(): string {
    return join(this.rootPath, AGENTS_FILE);
  }

  async init(): Promise<void> {
    await ensureDir(this.dataPath);
    
    if (!await exists(this.issuesPath)) {
      await Deno.writeTextFile(this.issuesPath, "[]");
    }
    
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
      const content = await Deno.readTextFile(this.issuesPath);
      const issues = JSON.parse(content);
      return issues.map((issue: any) => ({
        ...issue,
        createdAt: new Date(issue.createdAt),
        updatedAt: new Date(issue.updatedAt),
        startedAt: issue.startedAt ? new Date(issue.startedAt) : undefined,
        completedAt: issue.completedAt ? new Date(issue.completedAt) : undefined,
        reviewStartedAt: issue.reviewStartedAt ? new Date(issue.reviewStartedAt) : undefined,
      }));
    } catch (error) {
      throw new StorageError(`Failed to read issues: ${error.message}`);
    }
  }

  async getIssue(id: string): Promise<Issue | null> {
    const issues = await this.getIssues();
    return issues.find((issue) => issue.id === id) || null;
  }

  async saveIssue(issue: Issue): Promise<void> {
    try {
      const issues = await this.getIssues();
      issues.push(issue);
      await this.writeIssues(issues);
    } catch (error) {
      throw new StorageError(`Failed to save issue: ${error.message}`);
    }
  }

  async updateIssue(id: string, updates: Partial<Issue>): Promise<void> {
    try {
      const issues = await this.getIssues();
      const index = issues.findIndex((issue) => issue.id === id);
      
      if (index === -1) {
        throw new StorageError(`Issue not found: ${id}`);
      }
      
      issues[index] = {
        ...issues[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      await this.writeIssues(issues);
    } catch (error) {
      throw new StorageError(`Failed to update issue: ${error.message}`);
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      const issues = await this.getIssues();
      const filtered = issues.filter((issue) => issue.id !== id);
      
      if (filtered.length === issues.length) {
        throw new StorageError(`Issue not found: ${id}`);
      }
      
      await this.writeIssues(filtered);
    } catch (error) {
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

  private async writeIssues(issues: Issue[]): Promise<void> {
    await Deno.writeTextFile(this.issuesPath, JSON.stringify(issues, null, 2));
  }
}

let storageInstance: Storage | null = null;

export async function getStorage(): Promise<Storage> {
  if (!storageInstance) {
    // Check if migration is needed
    const migration = new StorageMigration();
    if (await migration.needsMigration()) {
      console.log("Detected old storage format. Migrating to new format...");
      await migration.migrate();
    }
    
    const storage = new FileBasedStorage();
    await storage.init();
    storageInstance = storage;
  }
  return storageInstance;
}

// Export the old FileStorage for migration purposes only
export { FileStorage as LegacyFileStorage };