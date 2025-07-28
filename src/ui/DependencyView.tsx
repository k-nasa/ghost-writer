import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Issue } from "../types/issue.ts";

interface DependencyViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue | null) => void;
  selectedIssue: Issue | null;
}

export const DependencyView: React.FC<DependencyViewProps> = ({
  issues,
  onSelectIssue,
  selectedIssue,
}: DependencyViewProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter issues with dependencies
  const issuesWithDeps = issues.filter(
    (issue: Issue) => issue.dependsOn.length > 0 || issue.dependedBy.length > 0
  );

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex(Math.min(issuesWithDeps.length - 1, selectedIndex + 1));
    } else if (key.return && issuesWithDeps[selectedIndex]) {
      onSelectIssue(issuesWithDeps[selectedIndex]);
    }
  });

  const getIssueById = (id: string) => issues.find((i: Issue) => i.id === id);

  const renderDependencyTree = (issue: Issue, indent = 0, visited = new Set<string>()) => {
    if (visited.has(issue.id)) return null;
    visited.add(issue.id);

    const lines: React.ReactNode[] = [];
    
    // Render current issue
    const isSelected = issuesWithDeps[selectedIndex]?.id === issue.id;
    lines.push(
      <Box key={`${issue.id}-main`}>
        <Text>{" ".repeat(indent)}</Text>
        <Text color={isSelected ? "cyan" : "white"} bold={isSelected}>
          [{issue.status.slice(0, 3).toUpperCase()}] {issue.title}
        </Text>
      </Box>
    );

    // Render dependencies
    if (issue.dependsOn.length > 0) {
      lines.push(
        <Box key={`${issue.id}-deps-label`}>
          <Text>{" ".repeat(indent + 2)}</Text>
          <Text color="yellow">└─ depends on:</Text>
        </Box>
      );

      issue.dependsOn.forEach((depId, index) => {
        const depIssue = getIssueById(depId);
        if (depIssue) {
          const isLast = index === issue.dependsOn.length - 1;
          lines.push(
            <Box key={`${issue.id}-dep-${depId}`}>
              <Text>{" ".repeat(indent + 4)}</Text>
              <Text color="gray">{isLast ? "└─" : "├─"} </Text>
              <Text color="white">
                [{depIssue.status.slice(0, 3).toUpperCase()}] {depIssue.title}
              </Text>
            </Box>
          );
        }
      });
    }

    // Render dependents
    if (issue.dependedBy.length > 0) {
      lines.push(
        <Box key={`${issue.id}-depby-label`}>
          <Text>{" ".repeat(indent + 2)}</Text>
          <Text color="green">└─ blocks:</Text>
        </Box>
      );

      issue.dependedBy.forEach((depId, index) => {
        const depIssue = getIssueById(depId);
        if (depIssue) {
          const isLast = index === issue.dependedBy.length - 1;
          lines.push(
            <Box key={`${issue.id}-depby-${depId}`}>
              <Text>{" ".repeat(indent + 4)}</Text>
              <Text color="gray">{isLast ? "└─" : "├─"} </Text>
              <Text color="white">
                [{depIssue.status.slice(0, 3).toUpperCase()}] {depIssue.title}
              </Text>
            </Box>
          );
        }
      });
    }

    return lines;
  };

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold color="green">Dependency Graph</Text>
        <Text color="gray"> (Use arrows/jk to navigate, Enter to select)</Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {issuesWithDeps.length === 0 ? (
          <Text color="gray">No issues with dependencies found.</Text>
        ) : (
          issuesWithDeps.map((issue: Issue) => (
            <Box key={issue.id} flexDirection="column" marginBottom={1}>
              {renderDependencyTree(issue)}
            </Box>
          ))
        )}
      </Box>

      {selectedIssue && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
          <Text bold>Selected: </Text>
          <Text>{selectedIssue.title}</Text>
          {selectedIssue.description && (
            <Text color="gray"> - {selectedIssue.description}</Text>
          )}
        </Box>
      )}
    </Box>
  );
};