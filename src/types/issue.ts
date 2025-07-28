export type IssueStatus = "plan" | "backlog" | "in_progress" | "done" | "cancelled";

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
  cancelledAt?: Date;
  agentName?: string;
  workTreePath?: string;
}

export interface IssueTree extends Issue {
  children: IssueTree[];
}

export const ISSUE_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  plan: ["backlog", "cancelled"],
  backlog: ["in_progress", "cancelled"],
  in_progress: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export function canTransitionTo(
  currentStatus: IssueStatus,
  targetStatus: IssueStatus,
): boolean {
  return ISSUE_STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
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