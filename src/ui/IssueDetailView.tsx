import React from "react";
import { Box, Text, useInput } from "ink";
import { Issue } from "../types/issue.ts";

interface IssueDetailViewProps {
  issue: Issue;
  allIssues: Issue[];
  onClose: () => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({ issue, allIssues, onClose }: IssueDetailViewProps) => {
  useInput((input, key) => {
    if (key.escape || input === "q" || input === "s") {
      onClose();
    }
  });

  // Split description by newlines for proper display
  const descriptionLines = issue.description?.split('\n') || [];
  
  // Get child issues by parentId
  const childIssues = allIssues.filter(i => i.parentId === issue.id);

  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      <Box borderStyle="double" borderColor="green" paddingX={1} marginBottom={1}>
        <Text bold color="green">Issue Details</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">Title: </Text>
          <Text>{issue.title}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text bold color="cyan">ID: </Text>
          <Text color="gray">{issue.id}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text bold color="cyan">Status: </Text>
          <Text color="yellow">[{issue.status.toUpperCase()}]</Text>
        </Box>

        {issue.parentId && (
          <Box marginBottom={1}>
            <Text bold color="cyan">Parent ID: </Text>
            <Text color="gray">{issue.parentId}</Text>
          </Box>
        )}

        {childIssues.length > 0 && (
          <Box marginBottom={1} flexDirection="column">
            <Text bold color="cyan">Children ({childIssues.length} sub-tasks):</Text>
            <Box flexDirection="column" marginLeft={2}>
              {childIssues.map((child) => (
                <Box key={child.id}>
                  <Text color="gray">• {child.title} [{child.status}]</Text>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {issue.dependsOn.length > 0 && (
          <Box marginBottom={1}>
            <Text bold color="cyan">Depends on: </Text>
            <Text color="gray">{issue.dependsOn.join(", ")}</Text>
          </Box>
        )}
      </Box>

      <Box borderStyle="single" borderColor="gray" paddingX={1} paddingY={1} flexGrow={1}>
        <Box flexDirection="column">
          <Text bold color="cyan" underline>Description:</Text>
          <Box marginTop={1} flexDirection="column">
            {descriptionLines.length === 0 ? (
              <Text color="gray">(No description)</Text>
            ) : (
              descriptionLines.map((line: string, index: number) => (
                <Box key={index}>
                  <Text>{line}</Text>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="center">
        <Text color="gray">Press ESC, Q, or S to close</Text>
      </Box>
    </Box>
  );
};