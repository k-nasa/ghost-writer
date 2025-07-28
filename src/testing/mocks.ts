import type { Storage } from "../infrastructure/storage.ts";
import type { Issue } from "../types/issue.ts";
import type { AgentRegistry } from "../types/agent.ts";
import { StorageError } from "../types/errors.ts";

export class MockStorage implements Storage {
  private issues = new Map<string, Issue>();
  private agentRegistry: AgentRegistry = {
    agents: {},
    maxAgents: 10,
  };

  constructor(initialIssues: Issue[] = []) {
    for (const issue of initialIssues) {
      this.issues.set(issue.id, issue);
    }
  }

  async init(): Promise<void> {
    // No-op for mock
  }

  async getIssues(): Promise<Issue[]> {
    return Array.from(this.issues.values());
  }

  async getIssue(id: string): Promise<Issue | null> {
    return this.issues.get(id) || null;
  }

  async saveIssue(issue: Issue): Promise<void> {
    this.issues.set(issue.id, issue);
  }

  async updateIssue(id: string, updates: Partial<Issue>): Promise<void> {
    const issue = this.issues.get(id);
    if (!issue) {
      throw new StorageError(`Issue not found: ${id}`);
    }
    const updatedIssue = {
      ...issue,
      ...updates,
      updatedAt: new Date(),
    };
    this.issues.set(id, updatedIssue);
  }

  async deleteIssue(id: string): Promise<void> {
    if (!this.issues.has(id)) {
      throw new StorageError(`Issue not found: ${id}`);
    }
    this.issues.delete(id);
  }

  async getAgentRegistry(): Promise<AgentRegistry> {
    return this.agentRegistry;
  }

  async saveAgentRegistry(registry: AgentRegistry): Promise<void> {
    this.agentRegistry = registry;
  }
}

export function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  const now = new Date();
  return {
    id: `issue-${Math.random().toString(36).substr(2, 9)}`,
    title: "Mock Issue",
    description: "This is a mock issue",
    status: "plan",
    createdAt: now,
    updatedAt: now,
    dependsOn: [],
    dependedBy: [],
    ...overrides,
  };
}