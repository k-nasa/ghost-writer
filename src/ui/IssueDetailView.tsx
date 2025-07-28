import React from "react";
import { Box, Text, useInput } from "ink";
import { Issue } from "../types/issue.ts";

interface IssueDetailViewProps {
  issue: Issue;
  onClose: () => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({ issue, onClose }: IssueDetailViewProps) => {
  useInput((input, key) => {
    if (key.escape || input === "q" || input === "d") {
      onClose();
    }
  });

  // Split description by newlines for proper display
  const descriptionLines = issue.description?.split('\n') || [];

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

        {issue.childIds.length > 0 && (
          <Box marginBottom={1}>
            <Text bold color="cyan">Children: </Text>
            <Text color="gray">{issue.childIds.length} sub-tasks</Text>
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
        <Text color="gray">Press ESC, Q, or D to close</Text>
      </Box>
    </Box>
  );
};