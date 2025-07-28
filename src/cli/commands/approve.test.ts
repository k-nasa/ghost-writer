import { assertEquals, assertExists } from "@std/assert";
import { approveCommand } from "./approve.ts";

// Test that approve command is properly configured
Deno.test("approve command configuration", () => {
  assertEquals(approveCommand.command, "approve <issueId>");
  assertEquals(approveCommand.describe, "Approve an issue (move from plan to backlog)");
  
  // Test builder function exists
  assertExists(approveCommand.builder);
  assertExists(approveCommand.handler);
});