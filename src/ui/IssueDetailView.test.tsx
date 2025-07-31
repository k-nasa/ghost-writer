import { describe, it, beforeEach, afterEach } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { render } from "ink-testing-library";
import React from "react";
import { IssueDetailView } from "./IssueDetailView.tsx";
import type { Issue } from "../types/issue.ts";

describe("IssueDetailView", () => {
  const mockIssue: Issue = {
    id: "test-issue",
    title: "Test Issue",
    description: "# Header\n\nThis is **bold** text with *italic* and a list:\n- Item 1\n- Item 2",
    status: "backlog",
    dependsOn: [],
    dependedBy: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnClose = () => {};
  const allIssues: Issue[] = [mockIssue];

  it("should render markdown content properly", () => {
    const { lastFrame } = render(
      <IssueDetailView 
        issue={mockIssue} 
        allIssues={allIssues} 
        onClose={mockOnClose} 
      />
    );
    
    const output = lastFrame();
    
    // Should contain the issue title
    expect(output).toContain("Test Issue");
    
    // Should render markdown header with symbol
    expect(output).toContain("█ Header");
    
    // Should contain list bullets
    expect(output).toContain("• Item 1");
    expect(output).toContain("• Item 2");
    
    // Should contain the text content
    expect(output).toContain("bold");
    expect(output).toContain("italic");
  });

  it("should handle empty description", () => {
    const emptyIssue: Issue = {
      ...mockIssue,
      description: ""
    };

    const { lastFrame } = render(
      <IssueDetailView 
        issue={emptyIssue} 
        allIssues={allIssues} 
        onClose={mockOnClose} 
      />
    );
    
    const output = lastFrame();
    expect(output).toContain("(No description)");
  });

  it("should handle undefined description", () => {
    const undefinedIssue: Issue = {
      ...mockIssue,
      description: undefined as any
    };

    const { lastFrame } = render(
      <IssueDetailView 
        issue={undefinedIssue} 
        allIssues={allIssues} 
        onClose={mockOnClose} 
      />
    );
    
    const output = lastFrame();
    expect(output).toContain("(No description)");
  });
});