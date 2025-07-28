import { assertEquals } from "@std/assert";
import React from "react";
import { render } from "ink-testing-library";
import { IssueForm } from "./IssueForm.tsx";

Deno.test("IssueForm - ESC key cancels form", () => {
  let cancelCalled = false;
  let submitCalled = false;

  const { stdin } = render(
    <IssueForm
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