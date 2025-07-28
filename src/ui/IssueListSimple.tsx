import React from "react";
import { Box, Text } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";

interface IssueListSimpleProps {
  issues: Issue[];
}

const statusColors: Record<IssueStatus, string> = {
  plan: "gray",
  backlog: "yellow", 
  progress: "blue",
  review: "magenta",
  blocked: "red",
  done: "green",
};

export const IssueListSimple: React.FC<IssueListSimpleProps> = ({ issues }) => {
  const statuses: IssueStatus[] = ["plan", "backlog", "progress", "review", "blocked", "done"];

  const renderStatusColumn = (status: IssueStatus) => {
    const statusIssues = issues.filter(issue => issue.status === status);
    
    return (
      <Box key={status} flexDirection="column" marginRight={2} minWidth={20}>
        <Box marginBottom={1}>
          <Text bold color={statusColors[status]}>
            {status.toUpperCase()} ({statusIssues.length})
          </Text>
        </Box>
        <Box flexDirection="column">
          {statusIssues.map((issue) => (
            <Text key={issue.id} color="white">
              • {issue.title.substring(0, 18)}
            </Text>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">Issue Kanban Board</Text>
      </Box>
      <Box>
        {statuses.map((status) => renderStatusColumn(status))}
      </Box>
    </Box>
  );
};