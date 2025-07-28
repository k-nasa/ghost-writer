import React from "react";
import { Box, Text } from "ink";
import { Issue } from "../types/issue.ts";
import { ProgressCalculator, IssueProgress } from "../domain/progress-calculator.ts";

interface IssuePreviewProps {
  issue: Issue | null;
  allIssues: Issue[];
}

const statusColors: Record<string, string> = {
  plan: "gray",
  backlog: "yellow",
  in_progress: "blue",
  in_review: "magenta",
  done: "green",
  archived: "gray",
};

export const IssuePreview: React.FC<IssuePreviewProps> = ({
  issue,
  allIssues,
}: IssuePreviewProps) => {
  if (!issue) {
    return (
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={1}
        flexDirection="column"
        height="100%"
      >
        <Text color="gray">No issue selected</Text>
      </Box>
    );
  }

  const progressCalculator = new ProgressCalculator(allIssues);
  const children = allIssues.filter(i => i.parentId === issue.id);
  const progress = children.length > 0
    ? progressCalculator.calculateProgress(issue.id)
    : null;

  return (
    <Box
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      paddingY={1}
      flexDirection="column"
      height="100%"
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">Issue Preview</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold wrap="wrap">{issue.title}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">ID: </Text>
        <Text>{issue.id}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">Status: </Text>
        <Text color={statusColors[issue.status] || "white"}>
          {issue.status.toUpperCase()}
        </Text>
      </Box>

      {issue.parentId && (
        <Box marginBottom={1}>
          <Text color="gray">Parent: </Text>
          <Text>{issue.parentId}</Text>
        </Box>
      )}

      {progress && (
        <Box marginBottom={1}>
          <Text color="gray">Progress: </Text>
          <Text
            color={
              progress.percentage === 100
                ? "green"
                : progress.percentage > 0
                ? "yellow"
                : "gray"
            }
          >
            {progress.completed}/{progress.total} ({progress.percentage}%)
          </Text>
        </Box>
      )}

      {issue.description && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">Description:</Text>
          <Box marginTop={1}>
            <Text wrap="wrap">{issue.description}</Text>
          </Box>
        </Box>
      )}

      {children.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">Children ({children.length}):</Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {children.slice(0, 10).map((childIssue) => {
              return (
                <Box key={childIssue.id} marginBottom={0}>
                  <Text color={statusColors[childIssue.status] || "white"}>
                    • {childIssue.title}
                  </Text>
                </Box>
              );
            })}
            {children.length > 10 && (
              <Text color="gray">... and {children.length - 10} more</Text>
            )}
          </Box>
        </Box>
      )}

      {issue.dependsOn && issue.dependsOn.length > 0 && (
        <Box marginTop={1}>
          <Text color="gray">Dependencies: </Text>
          <Text>{issue.dependsOn.length}</Text>
        </Box>
      )}

      {issue.createdAt && (
        <Box marginTop={1}>
          <Text color="gray">Created: </Text>
          <Text>{new Date(issue.createdAt).toLocaleString()}</Text>
        </Box>
      )}
    </Box>
  );
};