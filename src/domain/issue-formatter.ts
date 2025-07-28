import type { Issue, IssueTree } from "../types/issue.ts";
import { gray, yellow, blue, green, red } from "@std/fmt/colors";

export class IssueFormatter {
  constructor() {
  }

  formatText(issues: Issue[]): string {
    if (issues.length === 0) {
      return "No issues found.";
    }

    // Build hierarchy map for indentation
    const issueMap = new Map(issues.map((issue) => [issue.id, issue]));
    const depthMap = new Map<string, number>();
    
    // Calculate depth for each issue
    const calculateDepth = (issue: Issue): number => {
      if (depthMap.has(issue.id)) {
        return depthMap.get(issue.id)!;
      }
      
      let depth = 0;
      let current = issue;
      while (current.parentId && issueMap.has(current.parentId)) {
        depth++;
        current = issueMap.get(current.parentId)!;
      }
      
      depthMap.set(issue.id, depth);
      return depth;
    };
    
    // Calculate depths
    for (const issue of issues) {
      calculateDepth(issue);
    }
    
    // Sort issues to group by hierarchy
    const sortedIssues = [...issues].sort((a, b) => {
      // First by root parent
      const getRootId = (issue: Issue): string => {
        let current = issue;
        while (current.parentId && issueMap.has(current.parentId)) {
          current = issueMap.get(current.parentId)!;
        }
        return current.id;
      };
      
      const rootA = getRootId(a);
      const rootB = getRootId(b);
      
      if (rootA !== rootB) {
        return rootA.localeCompare(rootB);
      }
      
      // Then by depth
      const depthA = depthMap.get(a.id) || 0;
      const depthB = depthMap.get(b.id) || 0;
      
      if (depthA !== depthB) {
        return depthA - depthB;
      }
      
      // Finally by ID
      return a.id.localeCompare(b.id);
    });

    const lines: string[] = [];
    for (const issue of sortedIssues) {
      const depth = depthMap.get(issue.id) || 0;
      lines.push(this.formatIssueText(issue, depth, issueMap));
    }
    return lines.join("\n");
  }

  formatTree(issues: Issue[]): string {
    // Build tree structure
    const issueMap = new Map(issues.map((issue) => [issue.id, issue]));
    const roots: IssueTree[] = [];
    const treeMap = new Map<string, IssueTree>();

    // Create IssueTree objects
    for (const issue of issues) {
      const treeNode: IssueTree = {
        ...issue,
        children: [],
      };
      treeMap.set(issue.id, treeNode);
    }

    // Build hierarchy
    for (const issue of issues) {
      const treeNode = treeMap.get(issue.id)!;
      if (issue.parentId && treeMap.has(issue.parentId)) {
        const parent = treeMap.get(issue.parentId)!;
        parent.children.push(treeNode);
      } else if (!issue.parentId) {
        roots.push(treeNode);
      }
    }

    if (roots.length === 0) {
      return "No root issues found.";
    }

    const lines: string[] = [];
    for (const root of roots) {
      this.formatTreeNode(root, lines, "", true);
    }
    return lines.join("\n");
  }

  formatJson(issues: Issue[]): string {
    return JSON.stringify(issues, null, 2);
  }

  private formatIssueText(issue: Issue, depth: number = 0, issueMap?: Map<string, Issue>): string {
    const status = this.formatStatusText(issue.status);
    const title = issue.title;
    
    // Add indentation based on depth
    const indent = "  ".repeat(depth);
    const prefix = depth > 0 ? "└─ " : "";
    
    let line = `${indent}${prefix}${status} ${title}`;
    
    if (issue.dependsOn.length > 0) {
      // Get titles for dependencies
      const depTitles = issue.dependsOn.map(depId => {
        if (issueMap && issueMap.has(depId)) {
          return issueMap.get(depId)!.title;
        }
        return depId; // Fallback to ID if not found
      });
      line += ` (depends on: ${depTitles.join(", ")})`;
    }
    
    if (issue.agentName) {
      line += ` [${issue.agentName}]`;
    }
    
    return line;
  }


  private formatStatusText(status: string): string {
    const statusText = this.getStatusLabel(status);
    switch (status) {
      case "plan":
        return gray(statusText);
      case "backlog":
        return yellow(statusText);
      case "in_progress":
        return blue(statusText);
      case "done":
        return green(statusText);
      case "cancelled":
        return red(statusText);
      default:
        return statusText;
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case "plan":
        return "[PLAN]";
      case "backlog":
        return "[BACKLOG]";
      case "in_progress":
        return "[IN PROGRESS]";
      case "done":
        return "[DONE]";
      case "cancelled":
        return "[CANCELLED]";
      default:
        return "[UNKNOWN]";
    }
  }

  private formatTreeNode(
    node: IssueTree,
    lines: string[],
    prefix: string,
    isLast: boolean,
  ): void {
    const connector = isLast ? "└── " : "├── ";
    const status = this.formatStatusText(node.status);
    
    let line = `${prefix}${connector}${status} ${node.title}`;
    
    if (node.dependsOn.length > 0) {
      line += ` (→ ${node.dependsOn.length})`;
    }
    
    if (node.agentName) {
      line += ` [${node.agentName}]`;
    }
    
    lines.push(line);

    const childPrefix = prefix + (isLast ? "    " : "│   ");
    node.children.forEach((child, index) => {
      this.formatTreeNode(
        child,
        lines,
        childPrefix,
        index === node.children.length - 1,
      );
    });
  }
}