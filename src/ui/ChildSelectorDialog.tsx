import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Issue } from "../types/issue.ts";

interface ChildSelectorDialogProps {
  parentIssue: Issue;
  availableIssues: Issue[];
  currentChildIds: string[];
  onConfirm: (selectedChildIds: string[]) => void;
  onCancel: () => void;
}

interface SelectableIssue {
  issue: Issue;
  selectable: boolean;
  reason?: string;
}

const statusColors: Record<string, string> = {
  plan: "gray",
  backlog: "yellow",
  in_progress: "blue",
  in_review: "magenta",
  done: "green",
  archived: "gray",
};

export const ChildSelectorDialog: React.FC<ChildSelectorDialogProps> = ({
  parentIssue,
  availableIssues,
  currentChildIds,
  onConfirm,
  onCancel,
}: ChildSelectorDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentChildIds));
  const [cursorIndex, setCursorIndex] = useState(0);

  // Prepare selectable issues with validation
  const selectableIssues: SelectableIssue[] = availableIssues
    .filter(issue => {
      // Exclude self and archived issues
      if (issue.id === parentIssue.id || issue.status === "archived") {
        return false;
      }
      return true;
    })
    .map(issue => {
      let selectable = true;
      let reason: string | undefined;

      // Check if this issue is an ancestor of the parent
      if (isAncestor(issue, parentIssue, availableIssues)) {
        selectable = false;
        reason = "Cannot select ancestor";
      }

      // Check if this issue is archived
      if (issue.status === "archived") {
        selectable = false;
        reason = "Archived";
      }

      return { issue, selectable, reason };
    });

  // Helper function to check if an issue is an ancestor
  function isAncestor(potentialAncestor: Issue, descendant: Issue, allIssues: Issue[]): boolean {
    let current = descendant;
    while (current.parentId) {
      if (current.parentId === potentialAncestor.id) {
        return true;
      }
      const parent = allIssues.find(i => i.id === current.parentId);
      if (!parent) break;
      current = parent;
    }
    return false;
  }

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return) {
      onConfirm(Array.from(selectedIds));
      return;
    }

    if (key.upArrow || input === "k") {
      setCursorIndex(Math.max(0, cursorIndex - 1));
    } else if (key.downArrow || input === "j") {
      setCursorIndex(Math.min(selectableIssues.length - 1, cursorIndex + 1));
    } else if (input === " ") {
      const currentItem = selectableIssues[cursorIndex];
      if (currentItem?.selectable) {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(currentItem.issue.id)) {
          newSelected.delete(currentItem.issue.id);
        } else {
          newSelected.add(currentItem.issue.id);
        }
        setSelectedIds(newSelected);
      }
    }
  });

  // Calculate visible range for scrolling
  const itemsPerPage = 12;
  const scrollOffset = Math.max(0, cursorIndex - itemsPerPage + 1);
  const visibleItems = selectableIssues.slice(scrollOffset, scrollOffset + itemsPerPage);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Select Children for: {parentIssue.title}</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color="gray">
          Space: toggle selection | Enter: confirm | ESC: cancel
        </Text>
      </Box>

      <Box flexDirection="column" height={itemsPerPage}>
        {visibleItems.map((item, visibleIndex) => {
          const actualIndex = scrollOffset + visibleIndex;
          const isSelected = selectedIds.has(item.issue.id);
          const isCursor = actualIndex === cursorIndex;
          const isCurrentChild = currentChildIds.includes(item.issue.id);

          return (
            <Box key={item.issue.id} marginBottom={0}>
              <Text color={isCursor ? "cyan" : "white"}>
                {isCursor ? "▶ " : "  "}
              </Text>
              <Text color={item.selectable ? "white" : "gray"}>
                [{isSelected ? "✓" : " "}]
              </Text>
              <Text color={item.selectable ? statusColors[item.issue.status] || "white" : "gray"}>
                {" "}
                {item.issue.title}
              </Text>
              {isCurrentChild && (
                <Text color="yellow"> (current)</Text>
              )}
              {item.reason && (
                <Text color="gray"> - {item.reason}</Text>
              )}
              {item.issue.parentId && item.issue.parentId !== parentIssue.id && (
                <Text color="gray"> (has parent)</Text>
              )}
            </Box>
          );
        })}
        {selectableIssues.length > itemsPerPage && (
          <Box marginTop={1}>
            <Text color="gray">
              ({cursorIndex + 1}/{selectableIssues.length})
            </Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>
          Selected: {selectedIds.size} | 
          Added: {Array.from(selectedIds).filter(id => !currentChildIds.includes(id as string)).length} | 
          Removed: {currentChildIds.filter(id => !selectedIds.has(id)).length}
        </Text>
      </Box>
    </Box>
  );
};