import type { Issue, IssueStatus } from "../types/issue.ts";
import {
  canTransitionTo,
  generateIssueId,
  validateIssueHierarchyDepth,
} from "../types/issue.ts";
import {
  CircularDependencyError,
  InvalidStateTransitionError,
  IssueNotFoundError,
  MaxDepthExceededError,
  DependencyError,
} from "../types/errors.ts";
import { getStorage } from "../infrastructure/storage.ts";

export class IssueService {
  async createIssue(params: {
    title: string;
    description?: string;
    parentId?: string;
  }): Promise<Issue> {
    const { title, description, parentId } = params;

    // Validate hierarchy depth
    if (!validateIssueHierarchyDepth(parentId)) {
      throw new MaxDepthExceededError(parentId!);
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await this.getIssue(parentId);
      if (!parent) {
        throw new IssueNotFoundError(parentId);
      }
    }

    const issue: Issue = {
      id: generateIssueId(parentId),
      title,
      description,
      status: "plan",
      parentId,
      childIds: [],
      dependsOn: [],
      dependedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const storage = await getStorage();
    await storage.saveIssue(issue);

    // Update parent's childIds if applicable
    if (parentId) {
      const parent = await storage.getIssue(parentId);
      if (parent) {
        parent.childIds.push(issue.id);
        await storage.updateIssue(parentId, { childIds: parent.childIds });
      }
    }

    return issue;
  }

  async getIssue(id: string): Promise<Issue | null> {
    const storage = await getStorage();
    return storage.getIssue(id);
  }

  async getIssues(filters?: {
    status?: IssueStatus[];
    parentId?: string | null;
  }): Promise<Issue[]> {
    const storage = await getStorage();
    let issues = await storage.getIssues();

    if (filters?.status) {
      issues = issues.filter((issue) => filters.status!.includes(issue.status));
    }

    if (filters?.parentId !== undefined) {
      issues = issues.filter((issue) => issue.parentId === filters.parentId);
    }

    return issues;
  }

  async updateIssueStatus(id: string, newStatus: IssueStatus): Promise<Issue> {
    const storage = await getStorage();
    const issue = await storage.getIssue(id);

    if (!issue) {
      throw new IssueNotFoundError(id);
    }

    if (!canTransitionTo(issue.status, newStatus)) {
      throw new InvalidStateTransitionError(id, issue.status, newStatus);
    }

    const updates: Partial<Issue> = { status: newStatus };

    // Set timestamps based on status
    switch (newStatus) {
      case "in_progress":
        updates.startedAt = new Date();
        break;
      case "done":
        updates.completedAt = new Date();
        break;
      case "cancelled":
        updates.cancelledAt = new Date();
        break;
    }

    await storage.updateIssue(id, updates);
    return { ...issue, ...updates, updatedAt: new Date() };
  }

  async approveIssue(id: string): Promise<Issue> {
    return this.updateIssueStatus(id, "backlog");
  }

  async updateIssue(issueId: string, updates: Partial<Issue>): Promise<Issue> {
    const storage = await getStorage();
    const issue = await storage.getIssue(issueId);
    
    if (!issue) throw new IssueNotFoundError(issueId);
    
    await storage.updateIssue(issueId, updates);
    return (await storage.getIssue(issueId))!;
  }

  async addDependency(issueId: string, dependsOnId: string): Promise<void> {
    if (issueId === dependsOnId) {
      throw new CircularDependencyError(issueId, dependsOnId);
    }

    const storage = await getStorage();
    const [issue, dependsOn] = await Promise.all([
      storage.getIssue(issueId),
      storage.getIssue(dependsOnId),
    ]);

    if (!issue) throw new IssueNotFoundError(issueId);
    if (!dependsOn) throw new IssueNotFoundError(dependsOnId);

    // Check for circular dependencies
    if (await this.wouldCreateCircularDependency(issueId, dependsOnId)) {
      throw new CircularDependencyError(issueId, dependsOnId);
    }

    // Update both issues
    if (!issue.dependsOn.includes(dependsOnId)) {
      issue.dependsOn.push(dependsOnId);
      await storage.updateIssue(issueId, { dependsOn: issue.dependsOn });
    }

    if (!dependsOn.dependedBy.includes(issueId)) {
      dependsOn.dependedBy.push(issueId);
      await storage.updateIssue(dependsOnId, { dependedBy: dependsOn.dependedBy });
    }
  }

  async removeDependency(issueId: string, dependsOnId: string): Promise<void> {
    const storage = await getStorage();
    const [issue, dependsOn] = await Promise.all([
      storage.getIssue(issueId),
      storage.getIssue(dependsOnId),
    ]);

    if (!issue) throw new IssueNotFoundError(issueId);
    if (!dependsOn) throw new IssueNotFoundError(dependsOnId);

    // Update both issues
    issue.dependsOn = issue.dependsOn.filter((id) => id !== dependsOnId);
    dependsOn.dependedBy = dependsOn.dependedBy.filter((id) => id !== issueId);

    await Promise.all([
      storage.updateIssue(issueId, { dependsOn: issue.dependsOn }),
      storage.updateIssue(dependsOnId, { dependedBy: dependsOn.dependedBy }),
    ]);
  }

  async getAvailableIssues(): Promise<Issue[]> {
    const storage = await getStorage();
    const issues = await storage.getIssues();
    const availableIssues: Issue[] = [];

    for (const issue of issues) {
      if (issue.status !== "backlog") continue;

      // Check if all dependencies are done
      const dependenciesDone = await this.areDependenciesDone(issue);
      if (dependenciesDone) {
        availableIssues.push(issue);
      }
    }

    return availableIssues;
  }

  private async areDependenciesDone(issue: Issue): Promise<boolean> {
    if (issue.dependsOn.length === 0) return true;

    const storage = await getStorage();
    for (const depId of issue.dependsOn) {
      const dep = await storage.getIssue(depId);
      if (!dep || dep.status !== "done") {
        return false;
      }
    }

    return true;
  }

  private async wouldCreateCircularDependency(
    issueId: string,
    dependsOnId: string,
  ): Promise<boolean> {
    // DFS to check if dependsOnId can reach issueId
    const visited = new Set<string>();
    const stack: Array<{ id: string; path: string[] }> = [
      { id: dependsOnId, path: [dependsOnId] }
    ];
    const storage = await getStorage();

    while (stack.length > 0) {
      const { id: currentId, path } = stack.pop()!;
      
      if (currentId === issueId) {
        // Found circular dependency
        const cycle = [...path, issueId].join(" → ");
        throw new DependencyError(
          `Circular dependency detected: ${cycle}`
        );
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = await storage.getIssue(currentId);
      if (current) {
        for (const depId of current.dependsOn) {
          stack.push({ id: depId, path: [...path, depId] });
        }
      }
    }

    return false;
  }
}