# Browser Connect MCP - Quick Reference Guide

## Setup (One-time)

1. **Configure Claude Desktop**:
   ```json
   // ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
   {
     "mcpServers": {
       "browser-connect-mcp": {
         "command": "npx",
         "args": ["-y", "browser-connect-mcp@0.4.1"]
       }
     }
   }
   ```

2. **Launch Chrome with debugging**:
   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   
   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

3. **Restart Claude Desktop**

## Quick Commands

### Browser Management
| What you want | What to say |
|--------------|-------------|
| List tabs | "Show me all browser tabs" |
| Connect to tab | "Connect to the GitHub tab" |
| Disconnect | "Disconnect from the tab" |
| Launch Chrome | "Launch Chrome with debugging" |

### Console Debugging
| What you want | What to say |
|--------------|-------------|
| View errors | "Show console errors" |
| Search logs | "Find console messages containing 'API'" |
| Filter by level | "Show only warnings and errors" |
| Pattern search | "Search console for /user.*login/i" |
| Analyze patterns | "What patterns do you see in the logs?" |

### Network Analysis
| What you want | What to say |
|--------------|-------------|
| Failed requests | "Show failed network requests" |
| Slow requests | "Find requests taking over 1 second" |
| API calls | "Show all POST requests to /api" |
| Performance stats | "Analyze network performance" |
| Export traffic | "Export network data as HAR" |

### Advanced Debugging
| What you want | What to say |
|--------------|-------------|
| Error correlation | "Find related errors and network failures" |
| Security scan | "Check for security vulnerabilities" |
| Performance profile | "Find performance bottlenecks" |
| Log insights | "Analyze the logs for issues" |

### Backend Debugging (NEW!)
| What you want | What to say |
|--------------|-------------|
| Stream log file | "Show me logs from server.log" |
| Filter backend errors | "Find errors in my backend logs" |
| Monitor Docker logs | "Stream logs from my Docker container" |
| Attach to Node.js | "Attach debugger to Node.js on port 9229" |
| Search log patterns | "Find database errors in backend logs" |
| Full-stack debugging | "Correlate frontend errors with backend logs" |

## Common Workflows

### 1. Debug an Error
```
1. "Connect to my app tab"
2. "Show recent errors"
3. "Find related network failures"
4. "What's causing these errors?"
```

### 2. Performance Analysis
```
1. "Connect to the slow page"
2. "Profile the page performance"
3. "Which requests are slowest?"
4. "How can I optimize this?"
```

### 3. API Debugging
```
1. "Connect to my app"
2. "Show API calls to /api/users"
3. "Which ones are failing?"
4. "Check console for related errors"
```

### 4. Security Check
```
1. "Connect to my website"
2. "Run a security scan"
3. "Check for exposed secrets"
4. "Review security recommendations"
```

### 5. Backend Debugging (NEW!)
```
1. "Stream logs from server.log"
2. "Filter for error messages"
3. "Find the root cause"
4. "Check if frontend errors correlate"
```

### 6. Full-Stack Debugging (NEW!)
```
1. "Connect to my app"
2. "Monitor API errors"
3. "Stream backend logs"
4. "Correlate frontend and backend issues"
```

## Tool Parameters Reference

### browser_connect
```typescript
{ tabId: "tab-id" }
```

### console_search
```typescript
{
  tabId: "tab-id",
  pattern?: "search text",
  level?: ["error", "warn"],
  regex?: true
}
```

### network_analyze
```typescript
{
  tabId: "tab-id",
  urlPattern?: "/api.*",
  method?: ["GET", "POST"],
  statusRange?: { min: 400, max: 599 },
  minDuration?: 1000
}
```

### error_correlate
```typescript
{
  tabId: "tab-id",
  timeWindow?: 5000,
  minSeverity?: "medium"
}
```

### backend_logs_stream (NEW!)
```typescript
{
  source: "file" | "process" | "docker" | "stdout",
  target: "/path/to/server.log",  // or container ID, process ID
  filters?: {
    level?: ["error", "warn"],
    pattern?: "database",
    regex?: false,
    since?: "2024-01-01T00:00:00Z",
    limit?: 1000
  },
  follow?: true,
  format?: "json" | "text" | "auto"
}
```

### backend_debugger_attach (NEW!)
```typescript
{
  host?: "localhost",
  port: 9229,  // Node.js debug port
  processId?: "12345",
  type?: "node" | "deno" | "chrome"
}
```

## Tips & Tricks

1. **Natural Language**: Just describe what you want - Claude understands context
2. **Batch Analysis**: Ask multiple questions at once for comprehensive debugging
3. **Real-time Monitoring**: Keep the connection open while reproducing bugs
4. **Pattern Matching**: Use regex for advanced console/network filtering
5. **Export Results**: Request HAR files or formatted reports for sharing

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No tabs found" | Launch Chrome with `--remote-debugging-port=9222` |
| "Connection failed" | Refresh the tab and try again |
| "Server not available" | Restart Claude Desktop |
| "Chrome not found" | Use `browser_launch` with custom path |
| "Cannot read log file" | Check file path and permissions |
| "Debugger won't attach" | Start Node.js with `--inspect=9229` |
| "Docker logs empty" | Ensure container is running and has logs |

## Need Help?

- Ask Claude: "How do I [your question]?"
- GitHub Issues: https://github.com/perception30/browser-connect-mcp/issues
- Full Docs: See NPM_DOCUMENTATION.md