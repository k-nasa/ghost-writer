export class GhostError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "GhostError";
  }
}

export class IssueNotFoundError extends GhostError {
  constructor(issueId: string) {
    super(`Issue not found: ${issueId}`, "ISSUE_NOT_FOUND");
  }
}

export class InvalidStateTransitionError extends GhostError {
  constructor(issueId: string, from: string, to: string) {
    super(
      `Invalid state transition for issue ${issueId}: ${from} → ${to}`,
      "INVALID_STATE_TRANSITION",
    );
  }
}

export class CircularDependencyError extends GhostError {
  constructor(issueId: string, dependencyId: string) {
    super(
      `Circular dependency detected: ${issueId} → ${dependencyId}`,
      "CIRCULAR_DEPENDENCY",
    );
  }
}

export class MaxDepthExceededError extends GhostError {
  constructor(parentId: string) {
    super(
      `Maximum hierarchy depth exceeded for parent: ${parentId}`,
      "MAX_DEPTH_EXCEEDED",
    );
  }
}

export class StorageError extends GhostError {
  constructor(message: string) {
    super(message, "STORAGE_ERROR");
  }
}

export class DependencyError extends GhostError {
  constructor(message: string) {
    super(message, "DEPENDENCY_ERROR");
  }
}

export class AgentLimitExceededError extends GhostError {
  constructor(limit: number) {
    super(`Agent limit exceeded: maximum ${limit} agents allowed`, "AGENT_LIMIT_EXCEEDED");
  }
}

export class WorktreeError extends GhostError {
  constructor(message: string) {
    super(message, "WORKTREE_ERROR");
  }
}