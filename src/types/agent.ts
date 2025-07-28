export interface Agent {
  name: string;
  currentIssueId?: string;
  status: "idle" | "working";
  startedAt?: Date;
}

export interface AgentRegistry {
  agents: Record<string, Agent>;
  maxAgents: number;
}

export function createAgent(name: string): Agent {
  return {
    name,
    status: "idle",
  };
}