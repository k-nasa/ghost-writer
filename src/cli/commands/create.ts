import type { CommandModule, Argv } from "yargs";
import { IssueService } from "../../domain/issue-service.ts";
import { GhostError } from "../../types/errors.ts";
import type { CreateArguments } from "../types.ts";

export const createCommand: CommandModule<{}, CreateArguments> = {
  command: "create <title>",
  describe: "Create a new issue",
  builder: (yargs: Argv) => {
    return yargs
      .positional("title", {
        describe: "Issue title",
        type: "string",
        demandOption: true,
      })
      .option("parent", {
        alias: "p",
        describe: "Parent issue ID",
        type: "string",
      })
      .option("description", {
        alias: "d",
        describe: "Issue description",
        type: "string",
      });
  },
  handler: async (argv: CreateArguments) => {
    try {
      const issueService = new IssueService();
      const issue = await issueService.createIssue({
        title: argv.title as string,
        description: argv.description as string | undefined,
        parentId: argv.parent as string | undefined,
      });

      console.log(`✓ Created issue: ${issue.id}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  Status: ${issue.status}`);
      if (issue.parentId) {
        console.log(`  Parent: ${issue.parentId}`);
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