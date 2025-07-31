import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { render } from "ink-testing-library";
import React from "react";
import { IssuePreview } from "./IssuePreview.tsx";
import type { Issue } from "../types/issue.ts";

describe("IssuePreview", () => {
  const mockIssue: Issue = {
    id: "test-issue",
    title: "Test Issue",
    description: "# Preview Header\n\nThis is **bold** text in preview:\n- Preview Item 1\n- Preview Item 2",
    status: "backlog",
    dependsOn: [],
    dependedBy: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const allIssues: Issue[] = [mockIssue];

  it("should render markdown content in preview", () => {
    const { lastFrame } = render(
      <IssuePreview issue={mockIssue} allIssues={allIssues} />
    );
    
    const output = lastFrame();
    
    // Should contain the issue title
    expect(output).toContain("Test Issue");
    
    // Should render markdown header with symbol
    expect(output).toContain("█ Preview Header");
    
    // Should contain list bullets
    expect(output).toContain("• Preview Item 1");
    expect(output).toContain("• Preview Item 2");
    
    // Should contain the text content
    expect(output).toContain("bold");
  });

  it("should handle null issue", () => {
    const { lastFrame } = render(
      <IssuePreview issue={null} allIssues={allIssues} />
    );
    
    const output = lastFrame();
    expect(output).toContain("No issue selected");
  });

  it("should handle long descriptions with truncation", () => {
    const longDescription = Array(30).fill("Line").map((line, i) => `${line} ${i + 1}`).join("\n");
    const longIssue: Issue = {
      ...mockIssue,
      description: longDescription
    };

    const { lastFrame } = render(
      <IssuePreview issue={longIssue} allIssues={allIssues} />
    );
    
    const output = lastFrame();
    
    // Should contain truncation indicator
    expect(output).toContain("...");
    expect(output).toContain("Line 1");
  });

  it("should handle empty description", () => {
    const emptyIssue: Issue = {
      ...mockIssue,
      description: undefined
    };

    const { lastFrame } = render(
      <IssuePreview issue={emptyIssue} allIssues={allIssues} />
    );
    
    const output = lastFrame();
    
    // Should not show description section
    expect(output).not.toContain("Description:");
  });
});