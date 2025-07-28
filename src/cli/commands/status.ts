import type { CommandModule, Argv } from "yargs";
import type { StatusArguments } from "../types.ts";
import { IssueService } from "../../domain/issue-service.ts";
import { WorktreeService, type WorktreeInfo } from "../../domain/worktree-service.ts";
import { GhostError } from "../../types/errors.ts";
import { getStorage } from "../../infrastructure/storage.ts";

export const statusCommand: CommandModule<{}, StatusArguments> = {
  command: "status",
  describe: "Show status of running agents and tasks",
  builder: (yargs: Argv) => {
    return yargs.option("json", {
      alias: "j",
      describe: "Output as JSON",
      type: "boolean",
      default: false,
    });
  },
  handler: async (argv: StatusArguments) => {
    try {
      const issueService = new IssueService();
      const worktreeService = new WorktreeService();
      const storage = await getStorage();
      
      // Get in-progress issues
      const inProgressIssues = await issueService.getIssues({ status: ["in_progress"] });
      
      // Get agent registry
      const agentRegistry = await storage.getAgentRegistry();
      
      // Get worktrees
      let worktrees: WorktreeInfo[] = [];
      try {
        worktrees = await worktreeService.listWorktrees();
      } catch (error) {
        // Not in a git repository
        worktrees = [];
      }
      
      if (argv.json) {
        const status = {
          agents: agentRegistry.agents,
          inProgressIssues: inProgressIssues.map(i => ({
            id: i.id,
            title: i.title,
            agent: i.agentName,
            startedAt: i.startedAt,
          })),
          worktrees: worktrees.map(w => ({
            issueId: w.issueId,
            branch: w.branch,
            path: w.path,
          })),
        };
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log("=== Ghost Status ===\n");
        
        // Active agents
        const activeAgents = Object.entries(agentRegistry.agents).filter(
          ([_, agent]) => agent.status === "working"
        );
        
        console.log(`Active Agents: ${activeAgents.length}/${agentRegistry.maxAgents}`);
        if (activeAgents.length > 0) {
          for (const [name, agent] of activeAgents) {
            console.log(`  • ${name}: ${agent.currentIssueId || "idle"}`);
          }
        }
        console.log();
        
        // In-progress issues
        console.log(`In Progress Issues: ${inProgressIssues.length}`);
        if (inProgressIssues.length > 0) {
          for (const issue of inProgressIssues) {
            const worktree = worktrees.find(w => w.issueId === issue.id);
            console.log(`  • ${issue.title}`);
            if (issue.agentName) {
              console.log(`    Agent: ${issue.agentName}`);
            }
            if (issue.startedAt) {
              const duration = Date.now() - issue.startedAt.getTime();
              const hours = Math.floor(duration / (1000 * 60 * 60));
              const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
              console.log(`    Duration: ${hours}h ${minutes}m`);
            }
            if (worktree) {
              console.log(`    Branch: ${worktree.branch}`);
            }
          }
        }
        console.log();
        
        // Worktrees
        if (worktrees.length > 0) {
          console.log(`Active Worktrees: ${worktrees.length}`);
          for (const worktree of worktrees) {
            const issue = inProgressIssues.find(i => i.id === worktree.issueId);
            console.log(`  • ${worktree.branch}`);
            console.log(`    Path: ${worktree.path}`);
            if (issue) {
              console.log(`    Issue: ${issue.title}`);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof GhostError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  },
};