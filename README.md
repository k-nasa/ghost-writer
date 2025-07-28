# Ghost Writer

A Unix philosophy-based TUI tool for hierarchical issue management and AI-human collaborative workflows.

## Features

- 🎯 Hierarchical issue management (up to 4 levels deep)
- 🖥️ Interactive TUI with Kanban board view
- 🔄 Git worktree integration for isolated development
- 📊 Progress tracking across issue hierarchies
- 🚀 AI-friendly issue-based workflow

## Prerequisites

- [Deno](https://deno.land/) (latest version)
- Git
- A Unix-like environment (macOS, Linux, WSL)

## Installation

### Quick Install

```bash
# Clone the repository
git clone <repository-url>
cd ghost-writer

# Run the installation script
./install.sh
```

### Manual Install

```bash
# Install using deno install
deno install \
    --allow-read \
    --allow-write \
    --allow-run \
    --allow-env \
    --name ghost \
    --force \
    ./src/main.ts

# Add Deno bin directory to your PATH
export PATH="$HOME/.deno/bin:$PATH"
```

Add the PATH export to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it permanent.

## Usage

### Basic Commands

```bash
# Create a new issue
ghost create "Issue title" --description "Detailed description"

# List all issues
ghost list

# Show issue details
ghost show <issueId>

# Launch interactive TUI
ghost tui

# Update issue status
ghost update <issueId> --status backlog

# Take an issue (creates git worktree)
ghost take <issueId>
```

### Issue Workflow

1. **Create**: Define issues with clear WHY and WHAT
2. **Approve**: Move from `plan` to `backlog` status
3. **Take**: Create isolated git worktree for development
4. **Progress**: Track through `in_progress`, `in_review`, to `done`

### TUI Controls

- **Navigation**: Arrow keys or `hjkl`
- **Actions**:
  - `c`: Create new issue
  - `e`: Edit selected issue
  - `d`: Archive issue
  - `Enter`: Drill down into sub-issues
  - `ESC`: Cancel current operation
  - `q`: Quit

## Development

### Build from Source

```bash
# Install dependencies and build
deno task build
```

### Run Tests

```bash
deno task test
```

### Development Mode

```bash
deno task dev <command>
```

## Uninstallation

```bash
# Run the uninstall script
./uninstall.sh

# Or manually remove
rm ~/.deno/bin/ghost
```

## Configuration

Ghost Writer stores all data in the `.ghost/` directory of your project:

- `.ghost/issues/`: Issue storage
- `.ghost/worktree/`: Git worktrees
- `.ghost/data/`: Additional data

## Contributing

1. Create an issue describing your feature/fix
2. Use `ghost take` to start development
3. Follow the issue-based workflow
4. Submit a pull request

## License

[License information here]