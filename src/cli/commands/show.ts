import type { CommandModule, Argv } from "yargs";
import type { ShowArguments } from "../types.ts";
import { IssueService } from "../../domain/issue-service.ts";
import { GhostError } from "../../types/errors.ts";
import { IssueFormatter } from "../../domain/issue-formatter.ts";
import { ProgressCalculator } from "../../domain/progress-calculator.ts";

export const showCommand: CommandModule<{}, ShowArguments> = {
  command: "show <issueId>",
  describe: "Show detailed information about an issue",
  builder: (yargs: Argv) => {
    return yargs
      .positional("issueId", {
        describe: "Issue ID or title to show",
        type: "string",
        demandOption: true,
      })
      .option("json", {
        alias: "j",
        describe: "Output as JSON",
        type: "boolean",
        default: false,
      });
  },
  handler: async (argv: ShowArguments) => {
    try {
      const issueService = new IssueService();
      
      // Try to get issue by ID first, then by title
      let issue = await issueService.getIssue(argv.issueId).catch(() => null);
      
      if (!issue) {
        // Search by title
        const allIssues = await issueService.getIssues();
        issue = allIssues.find(i => i.title === argv.issueId) || null;
        
        if (!issue) {
          throw new GhostError(
            `Issue not found: ${argv.issueId}`,
            "ISSUE_NOT_FOUND"
          );
        }
      }
      
      if (argv.json) {
        console.log(JSON.stringify(issue, null, 2));
      } else {
        // Get parent and children for context
        let parent = null;
        if (issue.parentId) {
          parent = await issueService.getIssue(issue.parentId).catch(() => null);
        }
        
        const allIssuesForChildren = await issueService.getIssues();
        const children = allIssuesForChildren.filter(i => i.parentId === issue.id);
        
        // Format output
        console.log("=== Issue Details ===\n");
        console.log(`ID: ${issue.id}`);
        console.log(`Title: ${issue.title}`);
        const formatter = new IssueFormatter();
        console.log(`Status: ${issue.status}`);
        console.log(`Created: ${issue.createdAt.toLocaleString()}`);
        
        if (issue.updatedAt) {
          console.log(`Updated: ${issue.updatedAt.toLocaleString()}`);
        }
        
        if (issue.description) {
          console.log(`\nDescription:\n${issue.description}`);
        }
        
        if (parent) {
          console.log(`\nParent: ${parent.title} (${parent.id})`);
        }
        
        if (issue.dependsOn && issue.dependsOn.length > 0) {
          console.log("\nDependencies:");
          for (const depId of issue.dependsOn) {
            const dep = await issueService.getIssue(depId).catch(() => null);
            if (dep) {
              console.log(`  • ${dep.title} (${dep.id}) - ${dep.status}`);
            } else {
              console.log(`  • ${depId} (not found)`);
            }
          }
        }
        
        if (children.length > 0) {
          console.log("\nChildren:");
          for (const child of children) {
            const progressCalc = new ProgressCalculator(allIssuesForChildren);
            const progress = progressCalc.calculateProgress(child.id);
            console.log(`  • ${child.title} (${child.id}) - ${child.status} [${progress.percentage}%]`);
          }
        }
        
        // Calculate and show progress
        const allIssuesForProgress = await issueService.getIssues();
        const progressCalc = new ProgressCalculator(allIssuesForProgress);
        const progress = progressCalc.calculateProgress(issue.id);
        console.log(`\nProgress: ${progress.percentage}%`);
        
        if (issue.agentName) {
          console.log(`\nAssigned to: ${issue.agentName}`);
        }
        
        if (issue.startedAt) {
          const duration = Date.now() - issue.startedAt.getTime();
          const hours = Math.floor(duration / (1000 * 60 * 60));
          const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
          console.log(`Started: ${issue.startedAt.toLocaleString()} (${hours}h ${minutes}m ago)`);
        }
      }
    } catch (error) {
      if (error instanceof GhostError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  },
};