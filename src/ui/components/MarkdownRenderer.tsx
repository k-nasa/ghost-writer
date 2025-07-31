import React from "react";
import { Box, Text } from "ink";

interface MarkdownRendererProps {
  content: string;
}

interface ParsedElement {
  type: 'text' | 'header' | 'bold' | 'italic' | 'list_item';
  content: string;
  level?: number; // for headers and list nesting
}

// Simple markdown parser using regex
const parseMarkdown = (content: string): ParsedElement[] => {
  const lines = content.split('\n');
  const elements: ParsedElement[] = [];

  for (const line of lines) {
    // Header parsing (# ## ###)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      elements.push({
        type: 'header',
        content: headerMatch[2],
        level: headerMatch[1].length
      });
      continue;
    }

    // List item parsing (- or * at start)
    const listMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
    if (listMatch) {
      const indentLevel = Math.floor(listMatch[1].length / 2); // 2 spaces = 1 level
      elements.push({
        type: 'list_item',
        content: listMatch[3],
        level: indentLevel
      });
      continue;
    }

    // Parse inline formatting for regular text
    if (line.trim()) {
      elements.push({
        type: 'text',
        content: line
      });
    } else {
      // Empty line
      elements.push({
        type: 'text',
        content: ''
      });
    }
  }

  return elements;
};

// Parse inline formatting (bold, italic) within text
const parseInlineFormatting = (text: string): React.ReactNode => {
  let currentText = text;
  let key = 0;

  // Process bold (**text**)
  currentText = currentText.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
    return `__BOLD_${key++}_${content}__`;
  });

  // Process italic (*text*)
  currentText = currentText.replace(/\*([^*]+)\*/g, (_, content) => {
    return `__ITALIC_${key++}_${content}__`;
  });

  // Split and reconstruct with React components
  const segments = currentText.split(/(__(?:BOLD|ITALIC)_\d+_[^_]+__)/);
  
  return (
    <React.Fragment>
      {segments.map((segment, i) => {
        if (segment.startsWith('__BOLD_')) {
          const content = segment.match(/__BOLD_\d+_([^_]+)__/)?.[1] || '';
          return <Text bold>{content}</Text>;
        } else if (segment.startsWith('__ITALIC_')) {
          const content = segment.match(/__ITALIC_\d+_([^_]+)__/)?.[1] || '';
          return <Text dimColor>{content}</Text>;
        } else if (segment) {
          return <Text>{segment}</Text>;
        }
        return null;
      })}
    </React.Fragment>
  );
};

const renderElement = (element: ParsedElement, index: number): React.ReactNode => {
  switch (element.type) {
    case 'header':
      const headerColors = ['red', 'yellow', 'cyan'] as const;
      const color = headerColors[(element.level || 1) - 1] || 'cyan';
      return (
        <Box key={index} marginBottom={1}>
          <Text bold color={color}>
            {element.level === 1 ? '█ ' : element.level === 2 ? '▓ ' : '▒ '}
            {element.content}
          </Text>
        </Box>
      );

    case 'list_item':
      const indent = (element.level || 0) * 2;
      return (
        <Box key={index} marginLeft={indent}>
          <Text color="gray">• </Text>
          {parseInlineFormatting(element.content)}
        </Box>
      );

    case 'text':
      if (!element.content.trim()) {
        return <Box key={index} height={1} />; // Empty line
      }
      return (
        <Box key={index}>
          {parseInlineFormatting(element.content)}
        </Box>
      );

    default:
      return (
        <Box key={index}>
          <Text>{element.content}</Text>
        </Box>
      );
  }
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }: MarkdownRendererProps) => {
  const elements = parseMarkdown(content);

  return (
    <Box flexDirection="column">
      {elements.map((element, index) => renderElement(element, index))}
    </Box>
  );
};