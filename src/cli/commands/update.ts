import type { CommandModule, Argv } from "yargs";
import type { UpdateArguments } from "../types.ts";
import { IssueService } from "../../domain/issue-service.ts";
import { GhostError } from "../../types/errors.ts";
import type { IssueStatus } from "../../types/issue.ts";

export const updateCommand: CommandModule<{}, UpdateArguments> = {
  command: "update <issueId>",
  describe: "Update an issue",
  builder: (yargs: Argv) => {
    return yargs
      .positional("issueId", {
        describe: "Issue ID to update",
        type: "string",
        demandOption: true,
      })
      .option("status", {
        alias: "s",
        describe: "New status for the issue",
        type: "string",
        choices: ["plan", "backlog", "in_progress", "done", "cancelled"],
      })
      .option("title", {
        alias: "t",
        describe: "New title for the issue",
        type: "string",
      })
      .option("description", {
        alias: "d",
        describe: "New description for the issue",
        type: "string",
      });
  },
  handler: async (argv: UpdateArguments) => {
    try {
      const issueService = new IssueService();
      
      // Get the issue first
      const issue = await issueService.getIssue(argv.issueId);
      if (!issue) {
        throw new GhostError(
          `Issue not found: ${argv.issueId}`,
          "ISSUE_NOT_FOUND"
        );
      }
      
      // Update status if provided
      if (argv.status) {
        const newStatus = argv.status as IssueStatus;
        const updated = await issueService.updateIssueStatus(issue.id, newStatus);
        console.log(`✓ Updated issue status: ${issue.id}`);
        console.log(`  Title: ${updated.title}`);
        console.log(`  Status: ${issue.status} → ${updated.status}`);
        
        // Re-fetch the issue for further updates
        const refreshedIssue = await issueService.getIssue(argv.issueId);
        if (refreshedIssue) {
          Object.assign(issue, refreshedIssue);
        }
      }
      
      // Update other fields if provided
      const updates: Partial<typeof issue> = {};
      let hasOtherUpdates = false;
      
      if (argv.title) {
        updates.title = argv.title;
        hasOtherUpdates = true;
      }
      
      if (argv.description !== undefined) {
        updates.description = argv.description;
        hasOtherUpdates = true;
      }
      
      if (hasOtherUpdates) {
        const updated = await issueService.updateIssue(issue.id, updates);
        console.log(`✓ Updated issue: ${issue.id}`);
        
        if (argv.title) {
          console.log(`  Title: ${issue.title} → ${updated.title}`);
        }
        
        if (argv.description !== undefined) {
          console.log(`  Description updated`);
        }
      }
      
      if (!argv.status && !hasOtherUpdates) {
        console.log("No updates specified. Use --status, --title, or --description to update the issue.");
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