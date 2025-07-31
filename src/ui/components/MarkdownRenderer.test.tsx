import { describe, it, beforeEach, afterEach } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { render } from "ink-testing-library";
import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer.tsx";

describe("MarkdownRenderer", () => {
  it("should render plain text correctly", () => {
    const { lastFrame } = render(<MarkdownRenderer content="Hello World" />);
    expect(lastFrame()).toContain("Hello World");
  });

  it("should render headers with different styles", () => {
    const content = `# Header 1
## Header 2  
### Header 3`;
    
    const { lastFrame } = render(<MarkdownRenderer content={content} />);
    const output = lastFrame();
    
    expect(output).toContain("█ Header 1");
    expect(output).toContain("▓ Header 2");
    expect(output).toContain("▒ Header 3");
  });

  it("should render list items with bullets", () => {
    const content = `- Item 1
- Item 2
  - Nested item`;
    
    const { lastFrame } = render(<MarkdownRenderer content={content} />);
    const output = lastFrame();
    
    expect(output).toContain("• Item 1");
    expect(output).toContain("• Item 2");
    expect(output).toContain("• Nested item");
  });

  it("should handle bold and italic text", () => {
    const content = "This is **bold** and this is *italic* text.";
    
    const { lastFrame } = render(<MarkdownRenderer content={content} />);
    const output = lastFrame();
    
    // The exact output format depends on how ink renders bold/italic in test environment
    expect(output).toContain("bold");
    expect(output).toContain("italic");
  });

  it("should handle empty lines correctly", () => {
    const content = `Line 1

Line 3`;
    
    const { lastFrame } = render(<MarkdownRenderer content={content} />);
    const output = lastFrame();
    
    expect(output).toContain("Line 1");
    expect(output).toContain("Line 3");
  });

  it("should handle mixed markdown elements", () => {
    const content = `# Main Title
This is a paragraph with **bold** text.

## Subsection
- List item with *italic*
- Another item

Regular text at the end.`;
    
    const { lastFrame } = render(<MarkdownRenderer content={content} />);
    const output = lastFrame();
    
    expect(output).toContain("█ Main Title");
    expect(output).toContain("▓ Subsection");
    expect(output).toContain("• List item");
    expect(output).toContain("• Another item");
    expect(output).toContain("Regular text");
  });

  it("should handle empty content", () => {
    const { lastFrame } = render(<MarkdownRenderer content="" />);
    const output = lastFrame();
    
    // Empty content should render without errors
    expect(output).toBeDefined();
  });
});