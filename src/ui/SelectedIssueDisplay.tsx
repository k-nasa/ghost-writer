import React, { memo } from "react";
import { Box, Text } from "ink";
import { Issue } from "../types/issue.ts";

interface SelectedIssueDisplayProps {
  selectedIssue: Issue | null;
}

// This component only re-renders when selectedIssue changes
export const SelectedIssueDisplay = memo(({ selectedIssue }: SelectedIssueDisplayProps) => {
  if (!selectedIssue) {
    return null;
  }

  return (
    <Box marginTop={1} paddingX={1}>
      <Text bold>{selectedIssue.title}</Text>
      {selectedIssue.description && (
        <Text color="gray"> - {selectedIssue.description}</Text>
      )}
    </Box>
  );
}, (prevProps: SelectedIssueDisplayProps, nextProps: SelectedIssueDisplayProps) => {
  // Only re-render if the selected issue ID changes
  return prevProps.selectedIssue?.id === nextProps.selectedIssue?.id;
});