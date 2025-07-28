import type { CommandModule, Argv } from "yargs";
import { IssueService } from "../../domain/issue-service.ts";
import { IssueFormatter } from "../../domain/issue-formatter.ts";
import type { IssueStatus } from "../../types/issue.ts";
import { GhostError } from "../../types/errors.ts";
import type { ListArguments } from "../types.ts";

export const listCommand: CommandModule<{}, ListArguments> = {
  command: "list",
  aliases: ["ls"],
  describe: "List issues",
  builder: (yargs: Argv) => {
    return yargs
      .option("status", {
        alias: "s",
        describe: "Filter by status",
        type: "array",
        choices: ["plan", "backlog", "in_progress", "in_review", "done", "archived"],
      })
      .option("format", {
        alias: "f",
        describe: "Output format",
        type: "string",
        choices: ["text", "json"],
        default: "text",
      })
      .option("tree", {
        alias: "t",
        describe: "Show as tree",
        type: "boolean",
        default: false,
      });
  },
  handler: async (argv: ListArguments) => {
    try {
      const issueService = new IssueService();

      const filters = argv.status
        ? { status: (Array.isArray(argv.status) ? argv.status : [argv.status]) as IssueStatus[] }
        : undefined;

      let issues = await issueService.getIssues(filters);
      
      // Filter out archived issues by default (unless specifically requested)
      if (!filters?.status?.includes("archived" as IssueStatus)) {
        issues = issues.filter(issue => issue.status !== "archived");
      }
      
      const formatter = new IssueFormatter();

      let output: string;
      if (argv.format === "json") {
        output = formatter.formatJson(issues);
      } else if (argv.tree) {
        output = formatter.formatTree(issues);
      } else {
        output = formatter.formatText(issues);
      }

      console.log(output);
    } catch (error) {
      if (error instanceof GhostError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  },
};