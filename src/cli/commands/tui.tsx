import type { CommandModule } from "yargs";
import React from "react";
import { render } from "ink";
import { TuiApp } from "../../ui/TuiApp.tsx";
import { GhostError } from "../../types/errors.ts";

export const tuiCommand: CommandModule = {
  command: "tui",
  describe: "Launch interactive TUI mode",
  handler: async () => {
    try {
      const app = render(<TuiApp />);
      await app.waitUntilExit();
    } catch (error) {
      if (error instanceof GhostError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  },
};