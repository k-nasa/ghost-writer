import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";
import { IssueService } from "../domain/issue-service.ts";
import { KanbanView } from "./KanbanView.tsx";
import { DependencyView } from "./DependencyView.tsx";
import { IssueForm } from "./IssueForm.tsx";
import { IssueEditForm } from "./IssueEditForm.tsx";
import { IssueDetailView } from "./IssueDetailView.tsx";
import { initDebugLog } from "./debug-logger.ts";

type ViewMode = "kanban" | "dependency";
type AppMode = "view" | "create" | "edit" | "detail";

interface ActionItem {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const TuiApp: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [appMode, setAppMode] = useState<AppMode>("view");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デバッグログを初期化
  useEffect(() => {
    initDebugLog();
  }, []);

  const { exit } = useApp();

  const issueService = new IssueService();

  // Load issues
  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedIssues = await issueService.getIssues();
      setIssues(loadedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);


  // Define actions
  const actions: ActionItem[] = useMemo(
    () => [
      {
        key: "a",
        label: "A(approve)",
        description: "Approve issue",
        enabled:
          selectedIssue !== null &&
          selectedIssue.status === "plan" &&
          appMode === "view",
      },
      {
        key: "d",
        label: "D(detail)",
        description: "Show details",
        enabled: selectedIssue !== null && appMode === "view",
      },
      {
        key: "e",
        label: "E(edit)",
        description: "Edit issue",
        enabled: selectedIssue !== null,
      },
      {
        key: "c",
        label: "C(create)",
        description: "Create issue",
        enabled: true,
      },
      {
        key: "v",
        label: "V(view)",
        description:
          viewMode === "kanban" ? "Show dependencies" : "Show kanban",
        enabled: true,
      },
      {
        key: "r",
        label: "R(reload)",
        description: "Reload issues",
        enabled: true,
      },
      { key: "q", label: "Q(quit)", description: "Exit", enabled: true },
    ],
    [selectedIssue, appMode, viewMode]
  );

  // Handle global key input
  useInput((input, key) => {
    if (appMode !== "view") return;


    switch (input.toLowerCase()) {
      case "c":
        setAppMode("create");
        break;
      case "a":
        if (selectedIssue && selectedIssue.status === "plan") {
          handleApproveIssue(selectedIssue.id);
        }
        break;
      case "d":
        if (selectedIssue && !showDetail) {
          setAppMode("detail");
          setShowDetail(true);
        }
        break;
      case "e":
        if (selectedIssue) {
          setAppMode("edit");
        }
        break;
      case "v":
        setViewMode(viewMode === "kanban" ? "dependency" : "kanban");
        break;
      case "r":
        loadIssues();
        break;
      case "q":
        exit();
        break;
    }
  });

  // Handle issue creation
  const handleCreateIssue = async (issueData: Partial<Issue>) => {
    try {
      await issueService.createIssue({
        title: issueData.title!,
        description: issueData.description,
        parentId: issueData.parentId,
      });
      await loadIssues();
      setAppMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
      setAppMode("view");
    }
  };

  // Handle issue update
  const handleUpdateIssue = async (
    issueId: string,
    updates: Partial<Issue>
  ) => {
    try {
      // TODO: Implement issue update in IssueService
      await loadIssues();
      setAppMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update issue");
      setAppMode("view");
    }
  };

  // Handle status change
  const handleStatusChange = async (
    issueId: string,
    newStatus: IssueStatus
  ) => {
    try {
      await issueService.updateIssueStatus(issueId, newStatus);
      await loadIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Handle issue approval
  const handleApproveIssue = async (issueId: string) => {
    try {
      await issueService.approveIssue(issueId);
      await loadIssues();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve issue");
    }
  };

  const handleSelectIssue = (issue: Issue | null) => {
    setSelectedIssue(issue);
  };

  const actionBarHeight = 3;

  if (loading) {
    return (
      <Box flexDirection="column">
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text color="yellow">Loading issues...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {error && (
          <Box marginBottom={1}>
            <Text color="red">Error: {error}</Text>
          </Box>
        )}

        {appMode === "create" && (
          <IssueForm
            onSubmit={handleCreateIssue}
            onCancel={() => setAppMode("view")}
          />
        )}

        {appMode === "edit" && selectedIssue && (
          <IssueEditForm
            issue={selectedIssue}
            onSubmit={(updates: Partial<Issue>) =>
              handleUpdateIssue(selectedIssue.id, updates)
            }
            onCancel={() => setAppMode("view")}
          />
        )}

        {appMode === "detail" && selectedIssue && (
          <IssueDetailView
            issue={selectedIssue}
            onClose={() => {
              setAppMode("view");
              setShowDetail(false);
            }}
          />
        )}

        {appMode === "view" && (
          <>
            {viewMode === "kanban" ? (
              <KanbanView
                issues={issues}
                onSelectIssue={handleSelectIssue}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <DependencyView
                issues={issues}
                onSelectIssue={handleSelectIssue}
                selectedIssue={selectedIssue}
              />
            )}
          </>
        )}
      </Box>

      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        height={actionBarHeight}
      >
        <Box>
          {actions.map((action: ActionItem, index: number) => (
            <React.Fragment key={action.key}>
              {index > 0 && <Text> | </Text>}
              <Text
                color={action.enabled ? "green" : "gray"}
                bold={action.enabled}
              >
                {action.label}
              </Text>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
