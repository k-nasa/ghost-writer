#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

import yargs from "yargs";
import { createCommand } from "./cli/commands/create.ts";
import { listCommand } from "./cli/commands/list.ts";
import { approveCommand } from "./cli/commands/approve.ts";
import { takeCommand } from "./cli/commands/take.ts";
import { statusCommand } from "./cli/commands/status.ts";
import { dependCommand } from "./cli/commands/depend.ts";
import { availableCommand } from "./cli/commands/available.ts";
import { tuiCommand } from "./cli/commands/tui.tsx";

const main = async () => {
  const argv = await yargs(Deno.args)
    .command(createCommand)
    .command(listCommand)
    .command(approveCommand)
    .command(takeCommand)
    .command(statusCommand)
    .command(dependCommand)
    .command(availableCommand)
    .command(tuiCommand)
    .demandCommand(1, "You need at least one command")
    .help()
    .alias("help", "h")
    .version("0.1.0")
    .alias("version", "v")
    .parse();
};

if (import.meta.main) {
  main().catch((error) => {
    console.error("Error:", error.message);
    Deno.exit(1);
  });
}