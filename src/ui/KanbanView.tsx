import React, {
  useState,
  useMemo,
  memo,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Box, Text, useInput } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";
import { ProgressCalculator } from "../domain/progress-calculator.ts";
import { debugLog, useRenderTracker } from "./debug-logger.ts";

interface KanbanViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue | null) => void;
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void;
}

const statusColors: Record<string, string> = {
  plan: "gray",
  backlog: "yellow",
  in_progress: "blue",
  done: "green",
  cancelled: "red",
};

const statusLabels: Record<IssueStatus, string> = {
  plan: "PLAN",
  backlog: "BACKLOG",
  in_progress: "IN PROGRESS",
  done: "DONE",
  cancelled: "CANCELLED",
};

interface SelectionState {
  column: number;
  row: number;
}

type SelectionAction =
  | { type: "MOVE_LEFT" }
  | { type: "MOVE_RIGHT"; max: number }
  | { type: "MOVE_UP" }
  | { type: "MOVE_DOWN"; max: number }
  | { type: "RESET_ROW" };

function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case "MOVE_LEFT":
      return state.column > 0 ? { column: state.column - 1, row: 0 } : state;
    case "MOVE_RIGHT":
      return state.column < action.max
        ? { column: state.column + 1, row: 0 }
        : state;
    case "MOVE_UP":
      return state.row > 0 ? { ...state, row: state.row - 1 } : state;
    case "MOVE_DOWN":
      return state.row < action.max ? { ...state, row: state.row + 1 } : state;
    case "RESET_ROW":
      return { ...state, row: 0 };
    default:
      return state;
  }
}

// Pure component for issue cards - only re-renders when props change
const IssueCardInternal = ({
  issue,
  isSelected,
  progress,
}: {
  issue: Issue;
  isSelected: boolean;
  progress?: { completed: number; total: number; percentage: number };
}) => {
  const { trackRender } = useRenderTracker(`IssueCard-${issue.id}`, {
    isSelected,
    progressTotal: progress?.total,
  });

  return (
    <Box
      borderStyle={isSelected ? "single" : undefined}
      borderColor={isSelected ? "cyan" : undefined}
      paddingX={1}
      marginBottom={1}
    >
      <Text color={isSelected ? "cyan" : "white"} wrap="truncate">
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

const IssueCard = memo(
  IssueCardInternal,
  (
    prevProps: {
      issue: Issue;
      isSelected: boolean;
      progress?: { completed: number; total: number; percentage: number };
    },
    nextProps: {
      issue: Issue;
      isSelected: boolean;
      progress?: { completed: number; total: number; percentage: number };
    }
  ) => {
    // Custom comparison to prevent re-renders when only other cards' selection changes
    return (
      prevProps.issue.id === nextProps.issue.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.progress?.total === nextProps.progress?.total &&
      prevProps.progress?.completed === nextProps.progress?.completed
    );
  }
);

// Column header component - only re-renders when selection state changes
const ColumnHeader = memo(
  ({
    status,
    count,
    isSelected,
  }: {
    status: IssueStatus;
    count: number;
    isSelected: boolean;
  }) => (
    <Box
      borderStyle="single"
      borderColor={isSelected ? "green" : "gray"}
      paddingX={1}
      marginBottom={1}
    >
      <Text bold color={statusColors[status]}>
        {statusLabels[status]} ({count})
      </Text>
    </Box>
  )
);

const KanbanViewInternal: React.FC<KanbanViewProps> = ({
  issues,
  onSelectIssue,
  onStatusChange,
}: KanbanViewProps) => {
  const statuses: IssueStatus[] = [
    "plan",
    "backlog",
    "in_progress",
    "done",
    "cancelled",
  ];

  // Use reducer for selection state to batch updates
  const [selection, dispatch] = useReducer(selectionReducer, {
    column: 0,
    row: 0,
  });

  // Debouncing refs for cursor movement
  const pendingMovementRef = useRef<{ type: string; max?: number } | null>(
    null
  );
  const movementTimeoutRef = useRef<number | null>(null);
  const DEBOUNCE_DELAY = 30; // 30ms debounce delay

  // レンダリング追跡
  const { trackRender } = useRenderTracker("KanbanView", {
    issuesCount: issues.length,
    selectedColumn: selection.column,
    selectedRow: selection.row,
    selectedIssueId: null, // No longer tracking selectedIssue
  });

  // Memoize issue grouping
  const issuesByStatus = useMemo(
    () =>
      statuses.reduce((acc, status) => {
        acc[status] = issues.filter((issue: Issue) => issue.status === status);
        return acc;
      }, {} as Record<IssueStatus, Issue[]>),
    [issues]
  );

  const currentColumnIssues = issuesByStatus[statuses[selection.column]];

  // Memoize progress calculator
  const progressCalculator = useMemo(
    () => new ProgressCalculator(issues),
    [issues]
  );

  // Pre-calculate all progress values to avoid recalculation during render
  const progressMap = useMemo(() => {
    const map = new Map<
      string,
      { completed: number; total: number; percentage: number }
    >();
    issues.forEach((issue) => {
      if (issue.childIds.length > 0) {
        map.set(issue.id, progressCalculator.calculateProgress(issue.id));
      }
    });
    return map;
  }, [issues, progressCalculator]);

  // Debounced dispatch function
  const debouncedDispatch = useCallback(
    (action: { type: string; max?: number }) => {
      // Clear existing timeout
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }

      // Store the pending movement
      pendingMovementRef.current = action;

      // Set new timeout
      movementTimeoutRef.current = setTimeout(() => {
        if (pendingMovementRef.current) {
          dispatch(pendingMovementRef.current);
          pendingMovementRef.current = null;
        }
      }, DEBOUNCE_DELAY);
    },
    []
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
    };
  }, []);

  useInput((input, key) => {
    // Get current highlighted issue inside the callback
    const currentHighlightedIssue = currentColumnIssues[selection.row] || null;

    if (key.leftArrow || input === "h") {
      debugLog(
        "KanbanView",
        `Key pressed: ${input || "leftArrow"} -> MOVE_LEFT`
      );
      debouncedDispatch({ type: "MOVE_LEFT" });
    } else if (key.rightArrow || input === "l") {
      debugLog(
        "KanbanView",
        `Key pressed: ${input || "rightArrow"} -> MOVE_RIGHT`
      );
      debouncedDispatch({ type: "MOVE_RIGHT", max: statuses.length - 1 });
    } else if (key.upArrow || input === "k") {
      debugLog("KanbanView", `Key pressed: ${input || "upArrow"} -> MOVE_UP`);
      debouncedDispatch({ type: "MOVE_UP" });
    } else if (key.downArrow || input === "j") {
      debugLog(
        "KanbanView",
        `Key pressed: ${input || "downArrow"} -> MOVE_DOWN`
      );
      debouncedDispatch({
        type: "MOVE_DOWN",
        max: currentColumnIssues.length - 1,
      });
    } else if (key.return) {
      if (currentHighlightedIssue) {
        debugLog(
          "KanbanView",
          `Key pressed: return -> select issue ${currentHighlightedIssue.id}`
        );
        onSelectIssue(currentHighlightedIssue);

        // Also update status if it's different
        const targetStatus = statuses[selection.column];
        if (currentHighlightedIssue.status !== targetStatus) {
          onStatusChange(currentHighlightedIssue.id, targetStatus);
        }
      }
    } else if (input === " ") {
      // Space key to just select without changing status
      if (currentHighlightedIssue) {
        debugLog(
          "KanbanView",
          `Key pressed: space -> select issue ${currentHighlightedIssue.id}`
        );
        onSelectIssue(currentHighlightedIssue);
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
          (Use arrows/hjkl to navigate, Enter to select & move, Space to select
          only)
        </Text>
      </Box>

      <Box flexGrow={1}>
        {statuses.map((status, colIndex) => {
          const columnIssues = issuesByStatus[status];
          const isSelectedColumn = selection.column === colIndex;

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
              />

              <Box flexDirection="column" flexGrow={1}>
                {columnIssues.map((issue: Issue, rowIndex: number) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    isSelected={isSelectedColumn && selection.row === rowIndex}
                    progress={progressMap.get(issue.id)}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export const KanbanView = memo(
  KanbanViewInternal,
  (prevProps: KanbanViewProps, nextProps: KanbanViewProps) => {
    // Only re-render if issues actually change
    return (
      prevProps.issues === nextProps.issues &&
      prevProps.onSelectIssue === nextProps.onSelectIssue &&
      prevProps.onStatusChange === nextProps.onStatusChange
    );
  }
);
