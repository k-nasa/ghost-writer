import { Issue } from "../types/issue.ts";

export interface IssueProgress {
  completed: number;
  total: number;
  percentage: number;
}

export class ProgressCalculator {
  private issueMap: Map<string, Issue>;

  constructor(issues: Issue[]) {
    this.issueMap = new Map(issues.map(issue => [issue.id, issue]));
  }

  /**
   * Calculate progress for an issue including all its children recursively
   */
  calculateProgress(issueId: string): IssueProgress {
    const issue = this.issueMap.get(issueId);
    if (!issue) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    // If no children, check if this issue itself is completed
    if (issue.childIds.length === 0) {
      const isCompleted = issue.status === "done" || issue.status === "cancelled";
      return {
        completed: isCompleted ? 1 : 0,
        total: 1,
        percentage: isCompleted ? 100 : 0,
      };
    }

    // Calculate progress for all children recursively
    let totalCompleted = 0;
    let totalCount = 0;

    for (const childId of issue.childIds) {
      const childProgress = this.calculateProgress(childId);
      totalCompleted += childProgress.completed;
      totalCount += childProgress.total;
    }

    const percentage = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;

    return {
      completed: totalCompleted,
      total: totalCount,
      percentage,
    };
  }

  /**
   * Get progress color based on percentage
   */
  getProgressColor(percentage: number): string {
    if (percentage === 0) return "red";
    if (percentage < 50) return "yellow";
    if (percentage < 100) return "blue";
    return "green";
  }

  /**
   * Format progress as string (e.g., "5/8")
   */
  formatProgress(progress: IssueProgress): string {
    return `${progress.completed}/${progress.total}`;
  }
}