import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Issue, IssueStatus } from "../types/issue.ts";
import { IssueService } from "../domain/issue-service.ts";
import { KanbanView } from "./KanbanView.tsx";
import { IssueForm } from "./IssueForm.tsx";
import { IssueEditForm } from "./IssueEditForm.tsx";
import { initDebugLog } from "./debug-logger.ts";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { ChildSelectorDialog } from "./ChildSelectorDialog.tsx";
import { NavigationStackImpl } from "./navigation-stack.ts";
import { Breadcrumb } from "./Breadcrumb.tsx";
import { IssueDetailView } from "./IssueDetailView.tsx";

type AppMode = "view" | "create" | "edit" | "confirm-delete" | "select-children" | "detail";

interface ActionItem {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const TuiApp: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [appMode, setAppMode] = useState<AppMode>("view");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kanbanCursorPosition, setKanbanCursorPosition] = useState({ column: 0, row: 0 });
  const [navigationStack] = useState(() => new NavigationStackImpl([]));

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
      navigationStack.updateIssues(loadedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Get current navigation state
  const currentNavState = navigationStack.current();
  
  // Filter issues based on current navigation state
  const displayIssues = useMemo(() => {
    if (currentNavState?.rootIssueId === null || currentNavState?.rootIssueId === undefined) {
      // Show root issues
      return issues.filter((issue: Issue) => !issue.parentId && issue.status !== "archived");
    } else {
      // Show children of the current root issue
      return issues.filter((issue: Issue) => 
        issue.parentId === currentNavState.rootIssueId && issue.status !== "archived"
      );
    }
  }, [issues, currentNavState]);


  // Define actions
  const actions: ActionItem[] = useMemo(
    () => [
      {
        key: "d",
        label: "D(delete)",
        description: "Archive issue",
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
        key: "p",
        label: "P(parent)",
        description: "Set children",
        enabled: selectedIssue !== null && appMode === "view",
      },
      {
        key: "s",
        label: "S(show)",
        description: "Show full details",
        enabled: selectedIssue !== null && appMode === "view",
      },
      {
        key: "r",
        label: "R(reload)",
        description: "Reload issues",
        enabled: true,
      },
      { key: "q", label: "Q(quit)", description: "Exit", enabled: true },
    ],
    [selectedIssue, appMode]
  );

  // Handle global key input
  useInput((input, key) => {
    if (appMode !== "view") return;


    switch (input.toLowerCase()) {
      case "c":
        setAppMode("create");
        break;
      case "d":
        if (selectedIssue) {
          handleDeleteIssue();
        }
        break;
      case "e":
        if (selectedIssue) {
          setAppMode("edit");
        }
        break;
      case "p":
        if (selectedIssue) {
          setAppMode("select-children");
        }
        break;
      case "s":
        if (selectedIssue) {
          setAppMode("detail");
        }
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
      await issueService.updateIssue(issueId, updates);
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


  const handleSelectIssue = (issue: Issue | null) => {
    setSelectedIssue(issue);
  };

  // Handle issue deletion
  const handleDeleteIssue = () => {
    if (selectedIssue) {
      setAppMode("confirm-delete");
    }
  };

  // Confirm and execute deletion (archive)
  const confirmDeleteIssue = async () => {
    if (!selectedIssue) return;
    
    try {
      await issueService.archiveIssue(selectedIssue.id);
      setAppMode("view");
      setSelectedIssue(null);
      await loadIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive issue");
      setAppMode("view");
    }
  };

  // Handle setting children for an issue
  const handleSetChildren = async (childIds: string[]) => {
    if (!selectedIssue) return;

    try {
      await issueService.setChildren(selectedIssue.id, childIds);
      setAppMode("view");
      await loadIssues();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update children");
      setAppMode("view");
    }
  };

  // Handle drill down into an issue
  const handleDrillDown = (issue: Issue) => {
    // Save current cursor position
    if (currentNavState) {
      currentNavState.cursorPosition = kanbanCursorPosition;
    }
    
    // Push new state to navigation stack
    navigationStack.push({
      rootIssueId: issue.id,
      cursorPosition: { column: 0, row: 0 }
    });
    
    // Reset cursor position for new view
    setKanbanCursorPosition({ column: 0, row: 0 });
    
    // Force re-render
    setError(null);
  };

  // Handle going back
  const handleGoBack = () => {
    const previousState = navigationStack.pop();
    if (previousState && navigationStack.current()) {
      // Restore cursor position
      setKanbanCursorPosition(navigationStack.current()!.cursorPosition);
      setError(null);
    }
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

{appMode === "confirm-delete" && selectedIssue && (
          <ConfirmDialog
            message={`Are you sure you want to archive "${selectedIssue.title}" and all its children?`}
            onConfirm={confirmDeleteIssue}
            onCancel={() => setAppMode("view")}
          />
        )}

        {appMode === "select-children" && selectedIssue && (
          <ChildSelectorDialog
            parentIssue={selectedIssue}
            availableIssues={issues.filter((issue: Issue) => issue.status !== "archived")}
            currentChildIds={issues
              .filter((issue: Issue) => issue.parentId === selectedIssue.id)
              .map((issue: Issue) => issue.id)}
            onConfirm={handleSetChildren}
            onCancel={() => setAppMode("view")}
          />
        )}

        {appMode === "detail" && selectedIssue && (
          <IssueDetailView
            issue={selectedIssue}
            allIssues={issues}
            onClose={() => setAppMode("view")}
          />
        )}

        {appMode === "view" && (
          <>
            <Breadcrumb items={navigationStack.getBreadcrumbs()} />
            <KanbanView
              issues={displayIssues}
              allIssues={issues}
              rootIssueId={currentNavState?.rootIssueId}
              onSelectIssue={handleSelectIssue}
              onStatusChange={handleStatusChange}
              initialCursorPosition={kanbanCursorPosition}
              onCursorPositionChange={setKanbanCursorPosition}
              onDrillDown={handleDrillDown}
              onGoBack={navigationStack.canGoBack() ? handleGoBack : undefined}
            />
          </>
        )}
      </Box>


      {/* Action bar */}
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
