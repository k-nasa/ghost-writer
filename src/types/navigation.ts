export interface NavigationState {
  rootIssueId: string | null;  // null means showing root issues
  cursorPosition: {
    column: number;
    row: number;
  };
}

export interface NavigationStack {
  stack: NavigationState[];
  
  push(state: NavigationState): void;
  pop(): NavigationState | undefined;
  current(): NavigationState | undefined;
  canGoBack(): boolean;
  clear(): void;
  getBreadcrumbs(): string[];
}