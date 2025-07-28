import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";
import { IssueService } from "../domain/issue-service.ts";
import { KanbanView } from "./KanbanView.tsx";
import { DependencyView } from "./DependencyView.tsx";
import { IssueForm } from "./IssueForm.tsx";
import { IssueEditForm } from "./IssueEditForm.tsx";
import { IssueDetailView } from "./IssueDetailView.tsx";
import { debugLog, useRenderTracker, initDebugLog } from "./debug-logger.ts";
import { SelectedIssueDisplay } from "./SelectedIssueDisplay.tsx";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // デバッグログを初期化
  useEffect(() => {
    initDebugLog();
  }, []);

  // レンダリング追跡
  const { trackRender } = useRenderTracker("TuiApp", {
    appMode,
    viewMode,
    selectedIssueId: selectedIssue?.id,
    loading,
    error: !!error,
  });

  useEffect(() => {
    trackRender();
  });
  const { exit } = useApp();
  const { stdout } = useStdout();

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

  // Define actions with useMemo to prevent recreation on every render
  const actions = useMemo<ActionItem[]>(
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
    []
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

  // Handle issue creation with useCallback to prevent unnecessary re-renders
  const handleCreateIssue = useCallback(async (issueData: Partial<Issue>) => {
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
  }, []);

  // Handle issue update with useCallback
  const handleUpdateIssue = useCallback(
    async (issueId: string, updates: Partial<Issue>) => {
      try {
        // TODO: Implement issue update in IssueService
        await loadIssues();
        setAppMode("view");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update issue");
        setAppMode("view");
      }
    },
    []
  );

  // Handle status change with useCallback
  const handleStatusChange = useCallback(
    async (issueId: string, newStatus: IssueStatus) => {
      try {
        await issueService.updateIssueStatus(issueId, newStatus);
        await loadIssues();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update status"
        );
      }
    },
    []
  );

  // Handle issue approval with useCallback
  const handleApproveIssue = useCallback(async (issueId: string) => {
    try {
      await issueService.approveIssue(issueId);
      await loadIssues();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve issue");
    }
  }, []);

  // Optimized onSelectIssue callback that only updates when issue actually changes
  const handleSelectIssue = useCallback(
    (issue: Issue | null) => {
      if (issue?.id !== selectedIssue?.id) {
        debugLog(
          "TuiApp",
          `handleSelectIssue: ${selectedIssue?.id || "null"} -> ${
            issue?.id || "null"
          }`
        );
        setSelectedIssue(issue);
      } else {
        debugLog(
          "TuiApp",
          `handleSelectIssue: skipped (same issue: ${issue?.id || "null"})`
        );
      }
    },
    [selectedIssue]
  );

  // Calculate terminal height for proper layout
  const terminalHeight = useMemo(() => stdout?.rows || 24, []);
  const actionBarHeight = useMemo(() => 3, []);
  const contentHeight = useMemo(() => terminalHeight - actionBarHeight, []);

  if (loading) {
    return (
      <Box flexDirection="column" height={terminalHeight}>
        <Box justifyContent="center" alignItems="center" height={contentHeight}>
          <Text color="yellow">Loading issues...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Main content area */}
      <Box flexDirection="column" height={contentHeight}>
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
              <>
                <KanbanView
                  issues={issues}
                  onSelectIssue={handleSelectIssue}
                  onStatusChange={handleStatusChange}
                />
                <SelectedIssueDisplay selectedIssue={selectedIssue} />
              </>
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

      {/* Action bar at bottom */}
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
