import type { CommandModule, Argv } from "yargs";
import { IssueService } from "../../domain/issue-service.ts";
import { IssueFormatter } from "../../domain/issue-formatter.ts";
import { GhostError } from "../../types/errors.ts";
import type { AvailableArguments } from "../types.ts";

export const availableCommand: CommandModule<{}, AvailableArguments> = {
  command: "available",
  aliases: ["avail"],
  describe: "List available issues (with all dependencies resolved)",
  builder: (yargs: Argv) => {
    return yargs
      .option("format", {
        alias: "f",
        describe: "Output format",
        type: "string",
        choices: ["text", "json"],
        default: "text",
      });
  },
  handler: async (argv: AvailableArguments) => {
    try {
      const issueService = new IssueService();
      const formatter = new IssueFormatter();
      
      const availableIssues = await issueService.getAvailableIssues();
      
      if (availableIssues.length === 0) {
        console.log("No available issues found.");
        return;
      }
      
      let output: string;
      if (argv.format === "json") {
        output = formatter.formatJson(availableIssues);
      } else {
        output = formatter.formatText(availableIssues);
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