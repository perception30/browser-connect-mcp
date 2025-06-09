# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
```bash
npm run build       # Compile TypeScript to JavaScript (dist/)
npm run dev        # Run in development mode with hot reload (tsx watch)
npm start          # Run the compiled JavaScript version
```

### Testing and Code Quality
```bash
npm test           # Run Jest tests
npm run lint       # Run ESLint on TypeScript files
npm run format     # Format code with Prettier
```

## Architecture Overview

### MCP Server Structure
This is a Model Context Protocol (MCP) server that bridges AI assistants with browser DevTools. The architecture follows these key patterns:

1. **Entry Point** (`src/index.ts`):
   - Initializes the MCP server with tool definitions
   - Handles tool requests through a single request handler that dispatches to specific tool implementations
   - Each tool returns structured JSON responses wrapped in MCP content format

2. **Browser Management** (`src/utils/browser-manager.ts`):
   - Central class managing all CDP (Chrome DevTools Protocol) connections
   - Maintains separate data stores for each connected tab:
     - Console messages (10K message buffer)
     - Network requests/responses (5K request buffer)
   - Handles event listeners for Console and Network domains
   - Provides browser launch functionality with Chrome path detection

3. **Tool Implementation Pattern**:
   - Tools are defined with JSON Schema input validation
   - Each tool checks connection state before accessing data
   - Error handling returns structured error responses with `isError: true`
   - Tools return data as JSON strings for consistent parsing

### Data Flow
1. Browser events (console, network) → CDP client → BrowserManager storage
2. Tool requests → MCP server → BrowserManager retrieval → Filtered results
3. All browser data is stored in-memory with automatic cleanup (rolling buffers)

### Key Design Decisions
- **Stateful connections**: Browser tabs must be explicitly connected before use
- **In-memory storage**: No persistence, data cleared on disconnect
- **Event-driven updates**: Real-time capture of browser events
- **Tool atomicity**: Each tool performs a single, focused operation

## Available Tools

1. `browser_list_tabs` - Discover available browser tabs
2. `browser_connect` - Establish CDP connection to a tab
3. `browser_disconnect` - Close connection and clear data
4. `console_search` - Search console messages with pattern/level filtering
5. `network_analyze` - Analyze network requests with advanced filters
6. `network_performance` - Get performance statistics
7. `browser_launch` - Launch Chrome with debugging enabled

## Chrome DevTools Protocol Integration

The server uses CDP domains:
- **Console**: Message capture and runtime console API calls
- **Network**: Request/response tracking with timing data
- **Runtime**: JavaScript execution context events
- **Page**: Page lifecycle events

Connection lifecycle: List targets → Connect to tab → Enable domains → Setup listeners → Capture events