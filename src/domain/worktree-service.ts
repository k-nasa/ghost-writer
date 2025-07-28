import { WorktreeError } from "../types/errors.ts";
import type { Issue } from "../types/issue.ts";

export interface WorktreeInfo {
  path: string;
  branch: string;
  issueId: string;
  commit: string;
}

export class WorktreeService {
  constructor(private baseDir: string = Deno.cwd()) {}

  async createWorktree(issue: Issue): Promise<WorktreeInfo> {
    const branchName = this.generateBranchName(issue);
    const worktreePath = await this.getWorktreePath(issue.id);
    
    try {
      // Check if we're in a git repository
      await this.runGitCommand(["rev-parse", "--git-dir"]);
      
      // Create worktree
      await this.runGitCommand([
        "worktree",
        "add",
        "-b",
        branchName,
        worktreePath,
      ]);
      
      // Get current commit
      const commit = await this.runGitCommand(["rev-parse", "HEAD"]);
      
      return {
        path: worktreePath,
        branch: branchName,
        issueId: issue.id,
        commit: commit.trim(),
      };
    } catch (error) {
      throw new WorktreeError(`Failed to create worktree: ${error.message}`);
    }
  }

  async removeWorktree(issueId: string): Promise<void> {
    const worktreePath = await this.getWorktreePath(issueId);
    
    try {
      // Remove worktree
      await this.runGitCommand(["worktree", "remove", worktreePath, "--force"]);
    } catch (error) {
      throw new WorktreeError(`Failed to remove worktree: ${error.message}`);
    }
  }

  async listWorktrees(): Promise<WorktreeInfo[]> {
    try {
      const output = await this.runGitCommand(["worktree", "list", "--porcelain"]);
      const worktrees: WorktreeInfo[] = [];
      
      const lines = output.split("\n");
      let currentWorktree: Partial<WorktreeInfo> = {};
      
      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          if (currentWorktree.path) {
            // Extract issue ID from path if possible
            const issueId = this.extractIssueIdFromPath(currentWorktree.path);
            if (issueId && currentWorktree.branch && currentWorktree.commit) {
              worktrees.push({
                path: currentWorktree.path,
                branch: currentWorktree.branch,
                issueId,
                commit: currentWorktree.commit,
              });
            }
          }
          currentWorktree = { path: line.substring(9) };
        } else if (line.startsWith("HEAD ")) {
          currentWorktree.commit = line.substring(5);
        } else if (line.startsWith("branch ")) {
          currentWorktree.branch = line.substring(7);
        }
      }
      
      // Handle last worktree
      if (currentWorktree.path) {
        const issueId = this.extractIssueIdFromPath(currentWorktree.path);
        if (issueId && currentWorktree.branch && currentWorktree.commit) {
          worktrees.push({
            path: currentWorktree.path,
            branch: currentWorktree.branch,
            issueId,
            commit: currentWorktree.commit,
          });
        }
      }
      
      return worktrees;
    } catch (error) {
      throw new WorktreeError(`Failed to list worktrees: ${error.message}`);
    }
  }

  async getWorktreeForIssue(issueId: string): Promise<WorktreeInfo | null> {
    const worktrees = await this.listWorktrees();
    return worktrees.find(w => w.issueId === issueId) || null;
  }

  private generateBranchName(issue: Issue): string {
    // Convert title to kebab-case
    const kebabTitle = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50); // Limit length
    
    // Use short ID (last 8 chars) for uniqueness
    const shortId = issue.id.slice(-8);
    
    return `ghost/${kebabTitle}-${shortId}`;
  }

  private async getWorktreePath(issueId: string): Promise<string> {
    const gitDir = await this.runGitCommand(["rev-parse", "--git-dir"]);
    const repoRoot = gitDir.trim().replace(/\/.git$/, "");
    return `${repoRoot}/../ghost-worktrees/${issueId}`;
  }

  private extractIssueIdFromPath(path: string): string | null {
    const match = path.match(/ghost-worktrees\/([^/]+)$/);
    return match ? match[1] : null;
  }

  private async runGitCommand(args: string[]): Promise<string> {
    const cmd = new Deno.Command("git", {
      args,
      cwd: this.baseDir,
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code, stdout, stderr } = await cmd.output();
    
    if (code !== 0) {
      const errorMessage = new TextDecoder().decode(stderr);
      throw new Error(errorMessage || "Git command failed");
    }
    
    return new TextDecoder().decode(stdout);
  }
}