import type { CommandModule, Argv } from "yargs";
import { updateCommand } from "./update.ts";
import { showCommand } from "./show.ts";
import { availableCommand } from "./available.ts";
import { approveCommand } from "./approve.ts";

export const issueCommand: CommandModule = {
  command: "issue <command>",
  describe: "Issue management commands",
  builder: (yargs: Argv) => {
    return yargs
      .command(updateCommand)
      .command(showCommand)
      .command(availableCommand)
      .command(approveCommand)
      .demandCommand(1, "You need to specify a subcommand");
  },
  handler: () => {
    // This will never be called because we demand a subcommand
  },
};