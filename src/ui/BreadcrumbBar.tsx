import React from "react";
import { Box, Text } from "ink";
import type { Issue } from "../types/issue.ts";

interface BreadcrumbBarProps {
  hierarchyPath: string[];
  issues: Issue[];
  currentParentIssue: Issue | null;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  hierarchyPath,
  issues,
  currentParentIssue,
}: BreadcrumbBarProps) => {
  // Build breadcrumb items
  const breadcrumbItems: string[] = ["Root"];
  
  hierarchyPath.forEach((issueId: string) => {
    const issue = issues.find((i: Issue) => i.id === issueId);
    if (issue) {
      breadcrumbItems.push(issue.title);
    }
  });

  return (
    <Box marginBottom={1}>
      <Text bold color="cyan">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Text color="gray"> → </Text>}
            <Text color={index === breadcrumbItems.length - 1 ? "yellow" : "gray"}>
              {item}
            </Text>
          </React.Fragment>
        ))}
      </Text>
      {hierarchyPath.length > 0 && (
        <Text color="gray"> (Press ESC or B to go back)</Text>
      )}
    </Box>
  );
};