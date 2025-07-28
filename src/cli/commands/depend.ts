import type { CommandModule, Argv } from "yargs";
import { IssueService } from "../../domain/issue-service.ts";
import { GhostError } from "../../types/errors.ts";

interface DependArguments {
  issueId: string;
  dependsOn: string;
  remove?: boolean;
}

export const dependCommand: CommandModule<{}, DependArguments> = {
  command: "depend <issueId> <dependsOn>",
  describe: "Add or remove dependency between issues",
  builder: (yargs: Argv) => {
    return yargs
      .positional("issueId", {
        describe: "Issue ID that depends on another",
        type: "string",
        demandOption: true,
      })
      .positional("dependsOn", {
        describe: "Issue ID that this issue depends on",
        type: "string",
        demandOption: true,
      })
      .option("remove", {
        alias: "r",
        describe: "Remove dependency instead of adding",
        type: "boolean",
        default: false,
      });
  },
  handler: async (argv: DependArguments) => {
    try {
      const issueService = new IssueService();
      
      if (argv.remove) {
        await issueService.removeDependency(argv.issueId, argv.dependsOn);
        console.log(`✓ Removed dependency: ${argv.issueId} no longer depends on ${argv.dependsOn}`);
      } else {
        await issueService.addDependency(argv.issueId, argv.dependsOn);
        console.log(`✓ Added dependency: ${argv.issueId} now depends on ${argv.dependsOn}`);
      }
      
      // Show current dependencies
      const issue = await issueService.getIssue(argv.issueId);
      if (issue && issue.dependsOn.length > 0) {
        console.log(`  Current dependencies: ${issue.dependsOn.join(", ")}`);
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