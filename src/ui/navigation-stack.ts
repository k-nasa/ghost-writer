import { NavigationState, NavigationStack } from "../types/navigation.ts";
import { Issue } from "../types/issue.ts";

export class NavigationStackImpl implements NavigationStack {
  stack: NavigationState[] = [];
  private allIssues: Issue[] = [];

  constructor(allIssues: Issue[]) {
    this.allIssues = allIssues;
    // Initialize with root state
    this.stack.push({
      rootIssueId: null,
      cursorPosition: { column: 0, row: 0 }
    });
  }

  updateIssues(issues: Issue[]): void {
    this.allIssues = issues;
  }

  push(state: NavigationState): void {
    this.stack.push(state);
  }

  pop(): NavigationState | undefined {
    // Always keep at least the root state
    if (this.stack.length > 1) {
      return this.stack.pop();
    }
    return undefined;
  }

  current(): NavigationState | undefined {
    return this.stack[this.stack.length - 1];
  }

  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  clear(): void {
    this.stack = [{
      rootIssueId: null,
      cursorPosition: { column: 0, row: 0 }
    }];
  }

  getBreadcrumbs(): string[] {
    const breadcrumbs: string[] = ["Root"];
    
    // Skip the first item (root) and build breadcrumbs
    for (let i = 1; i < this.stack.length; i++) {
      const state = this.stack[i];
      if (state.rootIssueId) {
        const issue = this.allIssues.find(issue => issue.id === state.rootIssueId);
        if (issue) {
          breadcrumbs.push(issue.title);
        } else {
          breadcrumbs.push("Unknown");
        }
      }
    }
    
    return breadcrumbs;
  }

  getIssueHierarchy(): Issue[] {
    const hierarchy: Issue[] = [];
    
    for (const state of this.stack) {
      if (state.rootIssueId) {
        const issue = this.allIssues.find(issue => issue.id === state.rootIssueId);
        if (issue) {
          hierarchy.push(issue);
        }
      }
    }
    
    return hierarchy;
  }
}