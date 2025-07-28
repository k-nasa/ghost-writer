export type IssueStatus = "plan" | "backlog" | "in_progress" | "in_review" | "done" | "archived";

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  parentId?: string;
  childIds: string[];
  dependsOn: string[];
  dependedBy: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  reviewStartedAt?: Date;
  archivedAt?: Date;
  agentName?: string;
  workTreePath?: string;
}

export interface IssueTree extends Issue {
  children: IssueTree[];
}

export const ISSUE_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  plan: ["backlog", "archived"],
  backlog: ["in_progress", "archived"],
  in_progress: ["in_review", "done", "archived"],
  in_review: ["in_progress", "done", "archived"],
  done: ["archived"],
  archived: [],
};

export function canTransitionTo(
  currentStatus: IssueStatus,
  targetStatus: IssueStatus,
): boolean {
  // Allow any status transition
  return true;
}

export function validateIssueHierarchyDepth(parentId: string | undefined, maxDepth = 4): boolean {
  if (!parentId) return true;
  const depth = parentId.split(".").length + 1;
  return depth <= maxDepth;
}

export function generateIssueId(parentId?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  const baseId = `${timestamp}-${random}`;
  return parentId ? `${parentId}.${baseId}` : baseId;
}