import type { CommandModule, Argv } from "yargs";
import { IssueService } from "../../domain/issue-service.ts";
import { WorktreeService } from "../../domain/worktree-service.ts";
import { GhostError } from "../../types/errors.ts";
import { IssueFormatter } from "../../domain/issue-formatter.ts";

interface TakeArguments {
  issueId?: string;
  agent?: string;
  force?: boolean;
}

export const takeCommand: CommandModule<{}, TakeArguments> = {
  command: "take [issueId]",
  describe: "Take an issue to work on",
  builder: (yargs: Argv) => {
    return yargs
      .positional("issueId", {
        describe: "Issue ID to take (optional, will show available issues if not provided)",
        type: "string",
      })
      .option("agent", {
        alias: "a",
        describe: "Agent name",
        type: "string",
        default: Deno.hostname(),
      })
      .option("force", {
        alias: "f",
        describe: "Force take even if already assigned",
        type: "boolean",
        default: false,
      });
  },
  handler: async (argv: TakeArguments) => {
    try {
      const issueService = new IssueService();
      const worktreeService = new WorktreeService();
      const formatter = new IssueFormatter();
      
      let issueId = argv.issueId;
      
      // If no issue ID provided, show available issues
      if (!issueId) {
        const availableIssues = await issueService.getAvailableIssues();
        
        if (availableIssues.length === 0) {
          console.log("No available issues found.");
          return;
        }
        
        console.log("Available issues:");
        console.log(formatter.formatText(availableIssues));
        console.log("\nRun 'ghost take <issueId>' to take an issue.");
        return;
      }
      
      // Get the issue
      const issue = await issueService.getIssue(issueId);
      if (!issue) {
        console.error(`Error: Issue not found: ${issueId}`);
        Deno.exit(1);
      }
      
      // Check if issue is available
      if (issue.status !== "backlog") {
        console.error(`Error: Issue is not in backlog status (current: ${issue.status})`);
        Deno.exit(1);
      }
      
      // Check if already assigned
      if (issue.agentName && !argv.force) {
        console.error(`Error: Issue is already assigned to ${issue.agentName}`);
        console.error("Use --force to reassign");
        Deno.exit(1);
      }
      
      // Check dependencies
      const available = await issueService.getAvailableIssues();
      if (!available.some(i => i.id === issueId)) {
        console.error("Error: Issue has unresolved dependencies");
        if (issue.dependsOn.length > 0) {
          console.error(`  Depends on: ${issue.dependsOn.join(", ")}`);
        }
        Deno.exit(1);
      }
      
      // Create worktree
      console.log("Creating worktree...");
      const worktree = await worktreeService.createWorktree(issue);
      
      // Update issue status and assignment
      await issueService.updateIssueStatus(issueId, "in_progress");
      await issueService.updateIssue(issueId, { 
        agentName: argv.agent,
        startedAt: new Date(),
      });
      
      console.log(`✓ Took issue: ${issue.id}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  Agent: ${argv.agent}`);
      console.log(`  Branch: ${worktree.branch}`);
      console.log(`  Worktree: ${worktree.path}`);
      console.log("\nTo start working:");
      console.log(`  cd ${worktree.path}`);
    } catch (error) {
      if (error instanceof GhostError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  },
};