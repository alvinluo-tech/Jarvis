# Jarvis

Personal Command Center - a unified AI layer over your personal web apps.

## Architecture

- **Frontend**: Tauri 2.0 + React + TypeScript
- **Daemon**: Node.js + Hono HTTP framework
- **Storage**: SQLite (local) or Supabase (cloud) via Repository pattern
- **AI**: Multi-provider support (DeepSeek, Kimi, OpenRouter, etc.)

## Modules

| Module | Description |
|--------|-------------|
| Chat | AI assistant with tool calling and conversation history |
| Todo | Task management with priorities, due dates, and tags |
| Reading | Reading list with progress tracking |
| Review | Daily/weekly summaries and statistics |
| Settings | Storage mode configuration (local/cloud) |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start daemon
pnpm --filter daemon dev

# Start frontend
pnpm --filter frontend dev
```

## Project Structure

```
Jarvis/
├── daemon/          # Node.js backend server
│   ├── src/
│   │   ├── api/         # REST API routes
│   │   ├── db/          # Database (SQLite + Supabase)
│   │   ├── tools/       # AI tool connectors
│   │   └── orchestrator/ # AI orchestration
│   └── data/        # Local SQLite database
├── frontend/        # Tauri + React desktop app
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── stores/      # Zustand state stores
│   │   └── lib/         # Utilities and Tauri IPC
│   └── src-tauri/   # Rust Tauri commands
└── supabase/        # Cloud database migrations
```
