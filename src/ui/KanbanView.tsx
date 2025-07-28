import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";
import { ProgressCalculator, IssueProgress } from "../domain/progress-calculator.ts";

interface KanbanViewProps {
  issues: Issue[];
  allIssues?: Issue[]; // For progress calculation
  onSelectIssue: (issue: Issue | null) => void;
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void;
  initialCursorPosition?: { column: number; row: number };
  onCursorPositionChange?: (position: { column: number; row: number }) => void;
}

const statusColors: Record<string, string> = {
  plan: "gray",
  backlog: "yellow",
  in_progress: "blue",
  in_review: "magenta",
  done: "green",
  archived: "gray",
};

const statusLabels: Record<IssueStatus, string> = {
  plan: "PLAN",
  backlog: "BACKLOG",
  in_progress: "IN PROGRESS",
  in_review: "IN REVIEW",
  done: "DONE",
  archived: "ARCHIVED",
};


const IssueCard = ({
  issue,
  isSelected,
  progress,
  isMoving = false,
  isTarget = false,
}: {
  issue: Issue;
  isSelected: boolean;
  progress?: IssueProgress;
  isMoving?: boolean;
  isTarget?: boolean;
}) => {
  const getBorderColor = () => {
    if (isMoving) return "yellow";
    if (isTarget) return "magenta";
    if (isSelected) return "cyan";
    return undefined;
  };

  const getTextColor = () => {
    if (isMoving) return "yellow";
    if (isTarget) return "magenta";
    if (isSelected) return "cyan";
    return "white";
  };

  return (
    <Box
      borderStyle={isSelected || isMoving || isTarget ? "single" : undefined}
      borderColor={getBorderColor()}
      paddingX={1}
      marginBottom={1}
    >
      <Text color={getTextColor()} wrap="truncate">
        {issue.title}
        {progress && progress.total > 0 && (
          <Text
            color={
              progress.percentage === 100
                ? "green"
                : progress.percentage > 0
                ? "yellow"
                : "gray"
            }
          >
            {" "}
            ({progress.completed}/{progress.total})
          </Text>
        )}
      </Text>
    </Box>
  );
};

const ColumnHeader = ({
  status,
  count,
  isSelected,
  isTargetColumn = false,
}: {
  status: IssueStatus;
  count: number;
  isSelected: boolean;
  isTargetColumn?: boolean;
}) => (
  <Box
    borderStyle="single"
    borderColor={isTargetColumn ? "magenta" : isSelected ? "green" : "gray"}
    paddingX={1}
    marginBottom={1}
  >
    <Text bold color={isTargetColumn ? "magenta" : statusColors[status]}>
      {statusLabels[status]} ({count})
    </Text>
  </Box>
);

export const KanbanView: React.FC<KanbanViewProps> = ({
  issues,
  allIssues,
  onSelectIssue,
  onStatusChange,
  initialCursorPosition,
  onCursorPositionChange,
}: KanbanViewProps) => {
  const statuses: IssueStatus[] = [
    "plan",
    "backlog",
    "in_progress",
    "in_review",
    "done",
  ];

  const [selectedColumn, setSelectedColumn] = useState(initialCursorPosition?.column || 0);
  const [selectedRow, setSelectedRow] = useState(initialCursorPosition?.row || 0);
  const [isMovingMode, setIsMovingMode] = useState(false);
  const [movingIssue, setMovingIssue] = useState<Issue | null>(null);
  const [targetColumn, setTargetColumn] = useState(0);

  // Issue grouping
  const issuesByStatus = statuses.reduce((acc, status) => {
    acc[status] = issues.filter((issue: Issue) => issue.status === status);
    return acc;
  }, {} as Record<IssueStatus, Issue[]>);

  const currentColumnIssues = issuesByStatus[statuses[selectedColumn]];
  const currentHighlightedIssue = currentColumnIssues[selectedRow] || null;

  // Adjust row if it's out of bounds after issues change
  React.useEffect(() => {
    const maxRow = currentColumnIssues.length - 1;
    if (selectedRow > maxRow && maxRow >= 0) {
      setSelectedRow(maxRow);
    } else if (currentColumnIssues.length === 0) {
      setSelectedRow(0);
    }
  }, [currentColumnIssues.length]);

  // Update selected issue when cursor moves
  React.useEffect(() => {
    if (currentHighlightedIssue) {
      onSelectIssue(currentHighlightedIssue);
    }
    // Notify parent about cursor position change
    if (onCursorPositionChange) {
      onCursorPositionChange({ column: selectedColumn, row: selectedRow });
    }
  }, [selectedColumn, selectedRow, currentHighlightedIssue?.id]);

  // Progress calculator - use all issues for accurate calculation
  const progressCalculator = new ProgressCalculator(allIssues || issues);

  // Calculate progress values
  const getProgress = (issue: Issue) => {
    if (issue.childIds.length > 0) {
      return progressCalculator.calculateProgress(issue.id);
    }
    return undefined;
  };

  useInput((input, key) => {
    const currentHighlightedIssue = currentColumnIssues[selectedRow] || null;

    if (isMovingMode) {
      // In moving mode
      if (key.leftArrow || input === "h") {
        if (targetColumn > 0) {
          setTargetColumn(targetColumn - 1);
        }
      } else if (key.rightArrow || input === "l") {
        if (targetColumn < statuses.length - 1) {
          setTargetColumn(targetColumn + 1);
        }
      } else if (key.return) {
        // Confirm move
        if (movingIssue) {
          const newStatus = statuses[targetColumn];
          onStatusChange(movingIssue.id, newStatus);
          setIsMovingMode(false);
          setMovingIssue(null);
          setSelectedColumn(targetColumn);
          setSelectedRow(0);
        }
      } else if (key.escape) {
        // Cancel move
        setIsMovingMode(false);
        setMovingIssue(null);
      }
    } else {
      // Normal navigation mode
      if (key.leftArrow || input === "h") {
        if (selectedColumn > 0) {
          setSelectedColumn(selectedColumn - 1);
          setSelectedRow(0);
        }
      } else if (key.rightArrow || input === "l") {
        if (selectedColumn < statuses.length - 1) {
          setSelectedColumn(selectedColumn + 1);
          setSelectedRow(0);
        }
      } else if (key.upArrow || input === "k") {
        if (selectedRow > 0) {
          setSelectedRow(selectedRow - 1);
        }
      } else if (key.downArrow || input === "j") {
        if (selectedRow < currentColumnIssues.length - 1) {
          setSelectedRow(selectedRow + 1);
        }
      } else if (key.return) {
        if (currentHighlightedIssue) {
          // Update status if it's different
          const targetStatus = statuses[selectedColumn];
          if (currentHighlightedIssue.status !== targetStatus) {
            onStatusChange(currentHighlightedIssue.id, targetStatus);
          }
        }
      } else if (input === "m") {
        // Enter moving mode
        if (currentHighlightedIssue) {
          setIsMovingMode(true);
          setMovingIssue(currentHighlightedIssue);
          setTargetColumn(selectedColumn);
        }
      } else if (input === "M") {
        // Shift+M: Move to previous status
        if (currentHighlightedIssue) {
          const currentStatusIndex = statuses.indexOf(currentHighlightedIssue.status);
          if (currentStatusIndex > 0) {
            const previousStatus = statuses[currentStatusIndex - 1];
            onStatusChange(currentHighlightedIssue.id, previousStatus);
          }
        }
      }
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold color="green">
          Kanban Board
        </Text>
        <Text color="gray">
          {" "}
          {isMovingMode
            ? "(h/l: move, Enter: confirm, ESC: cancel)"
            : "(arrows/hjkl: navigate, m: move status, M: revert status)"}
        </Text>
      </Box>
      {isMovingMode && movingIssue && (
        <Box marginBottom={1}>
          <Text color="yellow">
            Moving: {movingIssue.title} → {statusLabels[statuses[targetColumn]]}
          </Text>
        </Box>
      )}

      <Box flexGrow={1}>
        {statuses.map((status, colIndex) => {
          const columnIssues = issuesByStatus[status];
          const isSelectedColumn = selectedColumn === colIndex;

          return (
            <Box
              key={status}
              flexDirection="column"
              width="20%"
              paddingRight={1}
            >
              <ColumnHeader
                status={status}
                count={columnIssues.length}
                isSelected={isSelectedColumn}
                isTargetColumn={isMovingMode && targetColumn === colIndex}
              />

              <Box flexDirection="column" flexGrow={1}>
                {columnIssues.map((issue: Issue, rowIndex: number) => {
                  const isMovingThisIssue = isMovingMode && movingIssue?.id === issue.id;
                  const isTargetPosition = isMovingMode && targetColumn === colIndex && movingIssue?.id !== issue.id;
                  
                  return (
                    <React.Fragment key={issue.id}>
                      <IssueCard
                        issue={issue}
                        isSelected={!isMovingMode && isSelectedColumn && selectedRow === rowIndex}
                        progress={getProgress(issue)}
                        isMoving={isMovingThisIssue}
                        isTarget={isTargetPosition}
                      />
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
