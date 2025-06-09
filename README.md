# Browser Connect MCP

A Model Context Protocol (MCP) server that enables AI assistants to connect to browser DevTools for debugging web applications. This tool provides direct access to console logs, network requests, and performance metrics through a standardized interface.

## Features

- 🔌 **Browser Connection**: Connect to any Chrome/Chromium browser with debugging enabled
- 📝 **Console Search**: Search and filter console messages by pattern, level, and time
- 🌐 **Network Analysis**: Analyze HTTP requests/responses with advanced filtering
- 📊 **Performance Metrics**: Get insights into network performance and bottlenecks
- 🚀 **Real-time Monitoring**: Capture browser events as they happen
- 🔍 **Pattern Matching**: Use regex patterns for powerful search capabilities
- 📁 **HAR Export**: Export network traffic to HTTP Archive format
- 🎯 **Advanced Search**: Named patterns, correlation, and search statistics
- 🏎️ **Performance Profiling**: Detect bottlenecks and get optimization recommendations
- 🤖 **AI-Powered Analysis**: Pre-built debugging prompts and intelligent insights
- 🔗 **Error Correlation**: Automatically correlate errors across console and network
- 🔒 **Security Scanning**: Detect vulnerabilities and security issues
- 📈 **Log Intelligence**: Find patterns, anomalies, and trends in your logs

## Installation

### Quick Start (Recommended)

The easiest way to use browser-connect-mcp is directly with npx - no installation required!

### Global Installation

```bash
npm install -g browser-connect-mcp
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/perception30/browser-connect-mcp.git
cd browser-connect-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Setup

### 1. Configure Claude Desktop

Add to your Claude Desktop configuration file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Using npx (Recommended - No Installation Required):**
```json
{
  "mcpServers": {
    "browser-connect": {
      "command": "npx",
      "args": ["browser-connect-mcp"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Using Global Installation:**
```json
{
  "mcpServers": {
    "browser-connect": {
      "command": "browser-connect-mcp",
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 2. Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the MCP server.

### 3. Start Using Browser DevTools

No manual Chrome launching needed! The MCP server handles everything:

1. **Launch Chrome with debugging enabled:**
   ```
   Ask: "Launch a Chrome browser for debugging"
   ```

2. **Or connect to an existing Chrome instance:**
   ```
   Ask: "List available browser tabs"
   ```

3. **Connect to a tab and start debugging:**
   ```
   Ask: "Connect to the first tab and show me any errors"
   ```

## Available Tools

### Browser Management

#### `browser_launch`
Launch a new Chrome browser with debugging enabled - no manual setup required!

```typescript
// Example usage
browser_launch({ 
  executablePath: "/path/to/chrome" // Optional - auto-detected if not provided
})
```

#### `browser_list_tabs`
List all available browser tabs that can be debugged.

```typescript
// Example usage
browser_list_tabs({ 
  host: "localhost", // Optional, default: localhost
  port: 9222        // Optional, default: 9222
})
```

#### `browser_connect`
Connect to a specific browser tab to start capturing console and network data.

```typescript
// Example usage
browser_connect({ 
  tabId: "FAB12E4567890",
  host: "localhost", // Optional
  port: 9222        // Optional
})
```

#### `browser_disconnect`
Disconnect from a browser tab and clear all captured data.

```typescript
// Example usage
browser_disconnect({ tabId: "FAB12E4567890" })
```

### Console Debugging

#### `console_search`
Search console messages with filtering options.

```typescript
// Example usage
console_search({
  tabId: "FAB12E4567890",
  pattern: "error",
  level: ["error", "warn"],
  limit: 50,
  regex: false  // Set to true for regex patterns
})
```

#### `console_advanced_search`
Advanced console search with pattern matching, correlation, and statistics.

```typescript
// Example usage
console_advanced_search({
  tabId: "FAB12E4567890",
  patterns: {
    include: ["error", "warning"],
    exclude: ["debug"],
    mode: "any"  // "any" for OR, "all" for AND
  },
  namedPatterns: {
    errorCode: "Error:\\s+(\\d+)",
    userId: "user[_-]?id[:\\s]+([\\w-]+)"
  },
  correlate: {
    timeWindow: 5000,
    fields: ["level"]
  },
  includeStats: true
})
```

### Network Analysis

#### `network_analyze`
Analyze network requests with advanced filtering.

```typescript
// Example usage
network_analyze({
  tabId: "FAB12E4567890",
  urlPattern: "api/.*",
  method: ["POST", "PUT"],
  statusRange: { min: 400, max: 599 },
  minDuration: 500,
  limit: 100
})
```

#### `network_performance`
Get network performance statistics.

```typescript
// Example usage
network_performance({ tabId: "FAB12E4567890" })
```

#### `network_export_har`
Export network traffic to HAR (HTTP Archive) format for analysis in tools like Chrome DevTools.

```typescript
// Example usage
network_export_har({ 
  tabId: "FAB12E4567890",
  includeResponseBodies: false 
})
```

### AI-Powered Analysis

#### `performance_profile`
Advanced performance profiling with bottleneck detection and recommendations.

```typescript
// Example usage
performance_profile({
  tabId: "FAB12E4567890",
  includeWaterfall: true,
  includeRecommendations: true
})
```

#### `error_correlate`
Automatically correlate errors between console and network to find root causes.

```typescript
// Example usage
error_correlate({
  tabId: "FAB12E4567890",
  timeWindow: 5000,
  minSeverity: "medium"
})
```

#### `security_scan`
Scan for security vulnerabilities in console and network traffic.

```typescript
// Example usage
security_scan({
  tabId: "FAB12E4567890",
  includeRecommendations: true
})
```

#### `log_analyze`
Intelligently analyze logs to find patterns, anomalies, and trends.

```typescript
// Example usage
log_analyze({
  tabId: "FAB12E4567890",
  includeAllInsights: false  // Set to true to see all insights
})
```

## Common Workflows

### Complete Debugging Session

```
You: "Launch Chrome and help me debug my web app at localhost:3000"

Assistant will:
1. browser_launch() - Start Chrome with debugging enabled
2. browser_list_tabs() - Show available tabs
3. browser_connect() - Connect to your app
4. Start monitoring console and network automatically

You: "Are there any errors?"

Assistant will:
- console_search() with level: ["error", "warn"]
- Show you any errors found

You: "What's causing the slow performance?"

Assistant will:
- performance_profile() - Analyze performance
- network_analyze() with minDuration filter
- Provide recommendations
```

### Quick Error Analysis

```
You: "Connect to my existing Chrome and check for security issues"

Assistant will:
1. browser_list_tabs() - Find your tabs
2. browser_connect() - Connect to active tab
3. security_scan() - Run security analysis
4. error_correlate() - Find related issues
5. Provide detailed report with fixes
```

## Detailed Examples

### Debug Failed API Calls

```
You: "Show me all failed API calls"

The MCP will automatically:
- Use network_analyze with statusRange: { min: 400, max: 599 }
- Filter for API endpoints
- Show error details and timing
```

### Find JavaScript Errors

```
AI: "Find all JavaScript errors in the console"

1. console_search({ 
     tabId: "...", 
     level: ["error"], 
     pattern: "TypeError|ReferenceError|SyntaxError",
     regex: true 
   })
```

### Performance Analysis

```
AI: "Which requests are taking more than 1 second?"

1. network_analyze({ 
     tabId: "...", 
     minDuration: 1000 
   })
```

### Export Network Traffic

```
AI: "Export the network traffic to HAR format for analysis"

1. network_export_har({ 
     tabId: "...",
     includeResponseBodies: false
   })
```

### Advanced Error Correlation

```
AI: "Find all related error messages within 5 seconds of each other"

1. console_advanced_search({
     tabId: "...",
     patterns: { include: ["error", "exception"] },
     correlate: { 
       timeWindow: 5000,
       fields: ["level"]
     }
   })
```

### Performance Bottleneck Detection

```
AI: "Analyze performance and find bottlenecks"

1. performance_profile({
     tabId: "...",
     includeWaterfall: true,
     includeRecommendations: true
   })
```

### Find Related Errors

```
AI: "Find all errors that might be related to each other"

1. error_correlate({
     tabId: "...",
     timeWindow: 5000,
     minSeverity: "low"
   })
```

### Security Vulnerability Check

```
AI: "Check for security issues in the application"

1. security_scan({
     tabId: "...",
     includeRecommendations: true
   })
```

### Intelligent Log Analysis

```
AI: "Analyze the logs and give me insights about what's happening"

1. log_analyze({
     tabId: "...",
     includeAllInsights: false
   })
```

## AI-Powered Debugging Prompts

The MCP includes pre-built debugging prompts that guide the AI through common debugging scenarios:

### Available Prompts

- **find_javascript_errors** - Comprehensive JavaScript error detection and analysis
- **debug_failed_api_calls** - Debug API failures with custom endpoint patterns
- **analyze_slow_page_load** - Performance analysis for slow loading pages
- **debug_memory_leaks** - Detect potential memory leaks from console patterns
- **security_audit** - Basic security audit of console and network traffic
- **debug_cors_issues** - Troubleshoot Cross-Origin Resource Sharing problems
- **analyze_render_performance** - Analyze rendering and paint performance
- **debug_websocket_issues** - Debug WebSocket connection problems

### Using Prompts

Simply ask Claude about your debugging need, and it will automatically use the appropriate prompt:

```
You: "Help me debug CORS issues"
Assistant: *Uses debug_cors_issues prompt to guide the analysis*

You: "Check if there are any memory leaks"
Assistant: *Uses debug_memory_leaks prompt to search for patterns*
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture

```
browser-connect-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── types/            # TypeScript type definitions
│   ├── utils/
│   │   ├── browser-manager.ts    # CDP connection management
│   │   ├── search-utils.ts       # Search and filter utilities
│   │   └── logger.ts             # Logging configuration
│   └── tools/            # Individual tool implementations
├── dist/                 # Compiled JavaScript
└── package.json
```

## Troubleshooting

### Chrome won't launch
- Ensure Chrome is installed in the default location
- Or provide the path: `browser_launch({ executablePath: "/path/to/chrome" })`

### Can't connect to tabs
- Make sure Chrome was launched with `--remote-debugging-port=9222`
- Or use `browser_launch()` to let the MCP handle it automatically

### No data appearing
- Ensure you've connected to a tab using `browser_connect()`
- Check that the website is generating console/network activity
- Try refreshing the page after connecting

## Security Considerations

- Browser debugging port is only accessible from localhost by default
- No data is persisted - all data is cleared on disconnect
- Sensitive data in console/network logs can be detected by security_scan()
- Use the security audit prompt for comprehensive security checks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io)
- Uses [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- Inspired by the need for better AI-assisted debugging tools