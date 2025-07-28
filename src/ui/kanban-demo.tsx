import React from "react";
import { render } from "ink";
import { IssueList } from "./IssueList.tsx";
import { Issue } from "../types/issue.ts";

const mockIssues: Issue[] = [
  {
    id: "issue-1",
    title: "Setup project",
    description: "Initialize the project structure",
    status: "done",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    parentId: null,
    dependsOn: [],
  },
  {
    id: "issue-2", 
    title: "Create domain models",
    description: "Define Issue and related types",
    status: "done",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    parentId: null,
    dependsOn: ["issue-1"],
  },
  {
    id: "issue-3",
    title: "Implement storage",
    description: "File-based storage system",
    status: "progress",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    parentId: null,
    dependsOn: ["issue-2"],
  },
  {
    id: "issue-4",
    title: "Add TUI components",
    description: "React Ink UI components",
    status: "progress",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    parentId: null,
    dependsOn: [],
  },
  {
    id: "issue-5",
    title: "Write tests",
    description: "Unit and integration tests",
    status: "backlog",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    parentId: null,
    dependsOn: [],
  },
  {
    id: "issue-6",
    title: "Add git integration",
    description: "Worktree management",
    status: "plan",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    parentId: null,
    dependsOn: [],
  },
];

const KanbanDemo = () => {
  return (
    <IssueList 
      issues={mockIssues}
      onSelectIssue={(issue) => {
        console.log("Selected issue:", issue.title);
      }}
    />
  );
};

if (import.meta.main) {
  render(<KanbanDemo />);
}