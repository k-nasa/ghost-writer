import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";

interface IssueListProps {
  issues: Issue[];
  onSelectIssue?: (issue: Issue) => void;
  onBack?: () => void;
}

const statusColors: Record<string, string> = {
  plan: "gray",
  backlog: "yellow",
  in_progress: "blue",
  done: "green",
  cancelled: "red",
};

export const IssueList: React.FC<IssueListProps> = ({ 
  issues, 
  onSelectIssue, 
  onBack 
}: IssueListProps) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedStatus, setSelectedStatus] = React.useState<IssueStatus | null>(null);
  const { exit } = useApp();

  const statuses: IssueStatus[] = ["plan", "backlog", "in_progress", "done", "cancelled"];
  
  const filteredIssues = selectedStatus 
    ? issues.filter((issue: Issue) => issue.status === selectedStatus)
    : issues;

  useInput((input, key) => {
    if (key.upArrow) {
      if (selectedStatus === null) {
        setSelectedIndex((prev: number) => Math.max(0, prev - 1));
      } else {
        setSelectedIndex((prev: number) => Math.max(0, prev - 1));
      }
    } else if (key.downArrow) {
      if (selectedStatus === null) {
        setSelectedIndex((prev: number) => Math.min(statuses.length - 1, prev + 1));
      } else {
        setSelectedIndex((prev: number) => Math.min(filteredIssues.length - 1, prev + 1));
      }
    } else if (key.leftArrow && selectedStatus !== null) {
      setSelectedStatus(null);
      setSelectedIndex(statuses.indexOf(selectedStatus));
    } else if (key.rightArrow && selectedStatus === null) {
      setSelectedStatus(statuses[selectedIndex]);
      setSelectedIndex(0);
    } else if (key.return) {
      if (selectedStatus !== null && filteredIssues[selectedIndex] && onSelectIssue) {
        onSelectIssue(filteredIssues[selectedIndex]);
      }
    } else if (key.escape || input === "q") {
      if (onBack) {
        onBack();
      } else {
        exit();
      }
    }
  });

  const renderStatusColumn = (status: IssueStatus, index: number) => {
    const statusIssues = issues.filter((issue: Issue) => issue.status === status);
    const isSelected = selectedStatus === null && selectedIndex === index;
    
    return (
      <Box key={status} flexDirection="column" marginRight={2} minWidth={20}>
        <Box marginBottom={1}>
          <Text 
            bold 
            color={statusColors[status]}
            backgroundColor={isSelected ? "gray" : undefined}
          >
            {isSelected ? "▶ " : "  "}{status.toUpperCase()} ({statusIssues.length})
          </Text>
        </Box>
        {selectedStatus === status && (
          <Box flexDirection="column">
            {statusIssues.map((issue, idx) => (
              <React.Fragment key={`${status}-${idx}`}>
                <Text 
                  color="white"
                  backgroundColor={selectedIndex === idx ? "gray" : undefined}
                >
                  {selectedIndex === idx ? "▶ " : "  "}
                  {issue.title.substring(0, 18)}
                </Text>
              </React.Fragment>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">Issue Kanban Board</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          Use ←/→ to navigate columns, ↑/↓ to select items, Enter to choose, q/ESC to quit
        </Text>
      </Box>
      <Box>
        {statuses.map((status, index) => renderStatusColumn(status, index))}
      </Box>
    </Box>
  );
};