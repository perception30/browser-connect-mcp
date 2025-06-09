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

```bash
# Clone the repository
git clone https://github.com/yourusername/browser-connect-mcp.git
cd browser-connect-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### 1. Start Chrome with Debugging

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

### 2. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "browser-connect": {
      "command": "node",
      "args": ["/path/to/browser-connect-mcp/dist/index.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 3. Available Tools

#### `browser_list_tabs`
List all available browser tabs.

```typescript
// Example usage
browser_list_tabs({ host: "localhost", port: 9222 })
```

#### `browser_connect`
Connect to a specific browser tab for debugging.

```typescript
// Example usage
browser_connect({ tabId: "FAB12E4567890", host: "localhost", port: 9222 })
```

#### `console_search`
Search console messages with filtering options.

```typescript
// Example usage
console_search({
  tabId: "FAB12E4567890",
  pattern: "error",
  level: ["error", "warn"],
  limit: 50
})
```

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

#### `console_advanced_search`
Advanced console search with pattern matching, correlation, and statistics.

```typescript
// Example usage
console_advanced_search({
  tabId: "FAB12E4567890",
  patterns: {
    include: ["error", "warning"],
    exclude: ["debug"],
    mode: "any"
  },
  namedPatterns: {
    errorCode: "Error\\s+(\\d+)",
    userId: "user[_-]?id[:\\s]+([\\w-]+)"
  },
  correlate: {
    timeWindow: 5000,
    fields: ["level"]
  },
  includeStats: true
})
```

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
  includeAllInsights: false
})

## Examples

### Debug Failed API Calls

```
AI: "Show me all failed API calls in the current tab"

1. browser_list_tabs()
2. browser_connect({ tabId: "..." })
3. network_analyze({ 
     tabId: "...", 
     urlPattern: "api/", 
     statusRange: { min: 400, max: 599 } 
   })
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

### Use AI Debugging Prompts

```
AI: "Show me available debugging prompts"

The server provides pre-built prompts for common debugging scenarios:
- find_javascript_errors
- debug_failed_api_calls
- analyze_slow_page_load
- debug_memory_leaks
- security_audit
- debug_cors_issues
- analyze_render_performance
- debug_websocket_issues
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

## Security Considerations

- Browser debugging port is only accessible from localhost by default
- No data is persisted unless explicitly configured
- All browser connections require explicit authorization
- Sensitive data in console/network logs should be filtered

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