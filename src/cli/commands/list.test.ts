import { assertEquals, assertExists } from "@std/assert";
import { listCommand } from "./list.ts";

// Test that list command is properly configured
Deno.test("list command configuration", () => {
  assertEquals(listCommand.command, "list");
  assertEquals(listCommand.aliases, ["ls"]);
  assertEquals(listCommand.describe, "List issues");
  
  // Test builder function exists
  assertExists(listCommand.builder);
  assertExists(listCommand.handler);
});