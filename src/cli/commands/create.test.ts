import { assertEquals, assertExists } from "@std/assert";
import { createCommand } from "./create.ts";

// Test that create command is properly configured
Deno.test("create command configuration", () => {
  assertEquals(createCommand.command, "create <title>");
  assertEquals(createCommand.describe, "Create a new issue");
  
  // Test builder function exists
  assertExists(createCommand.builder);
  assertExists(createCommand.handler);
});