# Browser Connect MCP - Quick Reference Guide

## Setup (One-time)

1. **Configure Claude Desktop**:
   ```json
   // ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
   {
     "mcpServers": {
       "browser-connect-mcp": {
         "command": "npx",
         "args": ["browser-connect-mcp"]
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
3. "Are there any exposed secrets?"
4. "Check for XSS vulnerabilities"
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

## Need Help?

- Ask Claude: "How do I [your question]?"
- GitHub Issues: https://github.com/perception30/browser-connect-mcp/issues
- Full Docs: See NPM_DOCUMENTATION.md