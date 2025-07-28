import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";

const GHOST_CLI = join(Deno.cwd(), "ghost");

async function runGhost(args: string[]): Promise<{ output: string; error: string; code: number }> {
  const cmd = new Deno.Command(GHOST_CLI, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const process = await cmd.output();
  const output = new TextDecoder().decode(process.stdout);
  const error = new TextDecoder().decode(process.stderr);

  return { output, error, code: process.code };
}

async function setupTestDir(): Promise<string> {
  const testDir = await Deno.makeTempDir();
  // Initialize ghost in the test directory
  const initCmd = new Deno.Command(GHOST_CLI, {
    args: ["list"],
    cwd: testDir,
    stdout: "piped",
    stderr: "piped",
  });
  await initCmd.output();
  return testDir;
}

async function cleanupTestDir(dir: string): Promise<void> {
  await Deno.remove(dir, { recursive: true });
}

Deno.test("E2E: ghost create command", async () => {
  const testDir = await setupTestDir();
  
  try {
    // Create an issue
    const createCmd = new Deno.Command(GHOST_CLI, {
      args: ["create", "Test Issue", "--description", "Test description"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const createResult = await createCmd.output();
    const createOutput = new TextDecoder().decode(createResult.stdout);
    
    assertEquals(createResult.code, 0);
    assertStringIncludes(createOutput, "✓ Created issue");
    assertStringIncludes(createOutput, "Test Issue");
    
    // List issues to verify creation
    const listCmd = new Deno.Command(GHOST_CLI, {
      args: ["list"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const listResult = await listCmd.output();
    const listOutput = new TextDecoder().decode(listResult.stdout);
    
    assertEquals(listResult.code, 0);
    assertStringIncludes(listOutput, "Test Issue");
  } finally {
    await cleanupTestDir(testDir);
  }
});

Deno.test("E2E: ghost list command", async () => {
  const testDir = await setupTestDir();
  
  try {
    // Create multiple issues
    const issues = [
      { title: "Issue 1", description: "First issue" },
      { title: "Issue 2", description: "Second issue" },
      { title: "Issue 3", description: "Third issue" },
    ];
    
    for (const issue of issues) {
      const cmd = new Deno.Command(GHOST_CLI, {
        args: ["create", issue.title, "--description", issue.description],
        cwd: testDir,
        stdout: "piped",
        stderr: "piped",
      });
      await cmd.output();
    }
    
    // List all issues
    const listCmd = new Deno.Command(GHOST_CLI, {
      args: ["list"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const listResult = await listCmd.output();
    const listOutput = new TextDecoder().decode(listResult.stdout);
    
    assertEquals(listResult.code, 0);
    for (const issue of issues) {
      assertStringIncludes(listOutput, issue.title);
    }
    
    // Test filtering by status
    const filteredCmd = new Deno.Command(GHOST_CLI, {
      args: ["list", "--status", "plan"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const filteredResult = await filteredCmd.output();
    const filteredOutput = new TextDecoder().decode(filteredResult.stdout);
    
    assertEquals(filteredResult.code, 0);
    // All created issues should be in plan status by default
    for (const issue of issues) {
      assertStringIncludes(filteredOutput, issue.title);
    }
  } finally {
    await cleanupTestDir(testDir);
  }
});

Deno.test("E2E: ghost approve command", async () => {
  const testDir = await setupTestDir();
  
  try {
    // Create an issue
    const createCmd = new Deno.Command(GHOST_CLI, {
      args: ["create", "Issue to Approve"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const createResult = await createCmd.output();
    const createOutput = new TextDecoder().decode(createResult.stdout);
    
    // Extract issue ID from output (the ID appears to be in format like mdjw2m10-7w6)
    const idMatch = createOutput.match(/✓ Created issue: ([\w-]+)/);
    if (!idMatch) throw new Error("Could not extract issue ID");
    const issueId = idMatch[1];
    
    // Approve the issue
    const approveCmd = new Deno.Command(GHOST_CLI, {
      args: ["approve", issueId],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const approveResult = await approveCmd.output();
    const approveOutput = new TextDecoder().decode(approveResult.stdout);
    
    assertEquals(approveResult.code, 0);
    assertStringIncludes(approveOutput, "✓ Approved issue");
    assertStringIncludes(approveOutput, issueId);
    
    // Verify issue details (list all to check)
    const listCmd = new Deno.Command(GHOST_CLI, {
      args: ["list"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped",
    });
    const listResult = await listCmd.output();
    const listOutput = new TextDecoder().decode(listResult.stdout);
    
    // Should see the issue in the list
    assertStringIncludes(listOutput, "Issue to Approve");
  } finally {
    await cleanupTestDir(testDir);
  }
});