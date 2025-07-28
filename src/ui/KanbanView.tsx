import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";
import { ProgressCalculator, IssueProgress } from "../domain/progress-calculator.ts";
import { IssuePreview } from "./IssuePreview.tsx";

interface KanbanViewProps {
  issues: Issue[];
  allIssues?: Issue[]; // For progress calculation
  rootIssueId?: string | null; // null means showing root issues
  onSelectIssue: (issue: Issue | null) => void;
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void;
  initialCursorPosition?: { column: number; row: number };
  onCursorPositionChange?: (position: { column: number; row: number }) => void;
  onDrillDown?: (issue: Issue) => void; // Called when Enter is pressed on an issue with children
  onGoBack?: () => void; // Called when ESC is pressed
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
  rootIssueId,
  onSelectIssue,
  onStatusChange,
  initialCursorPosition,
  onCursorPositionChange,
  onDrillDown,
  onGoBack,
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
          // Check if issue has children and drill down is available
          if (currentHighlightedIssue.childIds && currentHighlightedIssue.childIds.length > 0 && onDrillDown) {
            onDrillDown(currentHighlightedIssue);
          } else {
            // Update status if it's different
            const targetStatus = statuses[selectedColumn];
            if (currentHighlightedIssue.status !== targetStatus) {
              onStatusChange(currentHighlightedIssue.id, targetStatus);
            }
          }
        }
      } else if (key.escape && onGoBack) {
        onGoBack();
      } else if (input === "m") {
        // Enter moving mode
        if (currentHighlightedIssue) {
          setIsMovingMode(true);
          setMovingIssue(currentHighlightedIssue);
          setTargetColumn(selectedColumn);
        }
      }
    }
  });

  return (
    <Box flexGrow={1}>
      {/* Main container with kanban board (70%) and preview (30%) */}
      <Box width="70%" flexDirection="column" paddingRight={1}>
        <Box marginBottom={1}>
          <Text bold color="green">
            Kanban Board
            {rootIssueId && allIssues && (() => {
              const rootIssue = allIssues.find(i => i.id === rootIssueId);
              return rootIssue ? ` - ${rootIssue.title}` : "";
            })()}
          </Text>
          <Text color="gray">
            {" "}
            {isMovingMode
              ? "(h/l: move, Enter: confirm, ESC: cancel)"
              : "(arrows/hjkl: navigate, m: move status, Enter: drill down)"}
          </Text>
          {onGoBack && (
            <Text color="gray"> | ESC: go back</Text>
          )}
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
                    
                    return (
                      <React.Fragment key={issue.id}>
                        <IssueCard
                          issue={issue}
                          isSelected={!isMovingMode && isSelectedColumn && selectedRow === rowIndex}
                          progress={getProgress(issue)}
                          isMoving={isMovingThisIssue}
                          isTarget={false}
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

      {/* Preview panel (30%) */}
      <Box width="30%" flexDirection="column">
        <IssuePreview
          issue={currentHighlightedIssue}
          allIssues={allIssues || issues}
        />
      </Box>
    </Box>
  );
};
