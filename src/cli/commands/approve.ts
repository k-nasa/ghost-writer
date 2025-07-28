import type { CommandModule, Argv } from "yargs";
import { IssueService } from "../../domain/issue-service.ts";
import { GhostError } from "../../types/errors.ts";

interface ApproveArguments {
  issueId: string;
}

export const approveCommand: CommandModule<{}, ApproveArguments> = {
  command: "approve <issueId>",
  describe: "Approve an issue (move from plan to backlog)",
  builder: (yargs: Argv) => {
    return yargs.positional("issueId", {
      describe: "Issue ID to approve",
      type: "string",
      demandOption: true,
    });
  },
  handler: async (argv: ApproveArguments) => {
    try {
      const issueService = new IssueService();
      const issueId = argv.issueId as string;

      const issue = await issueService.getIssue(issueId);
      if (!issue) {
        console.error(`Error: Issue not found: ${issueId}`);
        Deno.exit(1);
      }

      const updated = await issueService.updateIssueStatus(issueId, "backlog");
      
      console.log(`✓ Approved issue: ${updated.id}`);
      console.log(`  Title: ${updated.title}`);
      console.log(`  Status: ${issue.status} → ${updated.status}`);
    } catch (error) {
      if (error instanceof GhostError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  },
};