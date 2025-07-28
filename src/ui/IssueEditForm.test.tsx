import { assertEquals } from "@std/assert";
import React from "react";
import { render } from "ink-testing-library";
import { IssueEditForm } from "./IssueEditForm.tsx";
import { Issue } from "../types/issue.ts";

Deno.test("IssueEditForm - ESC key cancels edit", () => {
  const testIssue: Issue = {
    id: "test-123",
    title: "Test Issue",
    description: "Test Description",
    status: "backlog",
    createdAt: new Date(),
    updatedAt: new Date(),
    dependsOn: [],
    dependedBy: [],
  };

  let cancelCalled = false;
  let submitCalled = false;

  const { stdin } = render(
    <IssueEditForm
      issue={testIssue}
      onSubmit={() => {
        submitCalled = true;
      }}
      onCancel={() => {
        cancelCalled = true;
      }}
    />
  );

  // Simulate ESC key press
  stdin.write("\x1B");

  // Assert that cancel was called and submit was not
  assertEquals(cancelCalled, true, "onCancel should be called when ESC is pressed");
  assertEquals(submitCalled, false, "onSubmit should not be called when ESC is pressed");
});