# Browser Connect MCP - NPM Package Documentation

[![npm version](https://img.shields.io/npm/v/browser-connect-mcp.svg)](https://www.npmjs.com/package/browser-connect-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/browser-connect-mcp.svg)](https://nodejs.org)

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Configuration](#configuration)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Common Use Cases](#common-use-cases)
8. [Examples](#examples)
9. [API Usage Examples](./API_USAGE_EXAMPLES.md)
10. [Troubleshooting](#troubleshooting)
11. [Contributing](#contributing)

## Overview

Browser Connect MCP is a Model Context Protocol (MCP) server that enables AI assistants to interact with browser DevTools for advanced web debugging. It provides real-time access to console logs, network traffic, performance metrics, and AI-powered debugging insights. Works with any MCP-compatible tool including Claude Desktop, Claude Code, Cursor, Cline, Roo-Cline, and more.

### Key Features

- 🔍 **Real-time Console Monitoring** - Capture and search console messages
- 🌐 **Network Analysis** - Monitor HTTP requests, responses, and performance
- 🤖 **AI-Enhanced Debugging** - Intelligent error correlation and log analysis
- 🛡️ **Security Scanning** - Identify potential vulnerabilities
- 📊 **Performance Profiling** - Detailed performance metrics and bottleneck detection
- 📁 **HAR Export** - Export network traffic for external analysis

### What is MCP?

Model Context Protocol (MCP) is an open protocol that standardizes how AI applications connect with external data sources and tools. This server implements MCP to give AI assistants direct access to browser debugging capabilities.

## Installation

### Prerequisites

- Node.js >= 18.0.0
- Chrome or Chromium browser
- MCP-compatible AI assistant (Claude Desktop, Cursor, Cline, etc.)

### Quick Start (Recommended)

The easiest way to use Browser Connect MCP is via npx (no installation required):

```bash
npx browser-connect-mcp
```


### Global Installation

Install globally for persistent access:

```bash
npm install -g browser-connect-mcp
```

### Development Installation

Clone and build from source:

```bash
git clone https://github.com/perception30/browser-connect-mcp.git
cd browser-connect-mcp
npm install
npm run build
```

## Getting Started

### 1. Configure Your AI Assistant

Add the server to your AI assistant's MCP configuration:

**Claude Desktop**:  
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`  
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Other MCP Tools**: Check your tool's documentation for the configuration file location.

**IMPORTANT:** Due to how MCP clients handle spawning commands, you MUST use the following configuration format with `npx` as the command and the package name as an argument:

```json
{
  "mcpServers": {
    "browser-connect-mcp": {
      "command": "npx",
      "args": ["-y", "browser-connect-mcp"]
    }
  }
}
```

**Note:** 
- The `-y` flag ensures npx runs without prompting (recommended by MCP)
- Do NOT use the package name directly as the command - this will cause a "spawn ENOENT" error

For global installation:
```json
{
  "mcpServers": {
    "browser-connect-mcp": {
      "command": "browser-connect-mcp"
    }
  }
}
```

### 2. Launch Chrome with Debugging

Start Chrome with remote debugging enabled:

**macOS**:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Windows**:
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**Linux**:
```bash
google-chrome --remote-debugging-port=9222
```

### 3. Restart Your AI Assistant

Restart your AI assistant application to load the MCP server configuration.

## Configuration

### Environment Variables

- `CHROME_REMOTE_DEBUGGING_PORT` - Custom debugging port (default: 9222)
- `CHROME_REMOTE_DEBUGGING_HOST` - Custom debugging host (default: localhost)
- `LOG_LEVEL` - Logging verbosity: error, warn, info, debug (default: info)

### Chrome Launch Options

When using the `browser_launch` tool:

```typescript
{
  executablePath?: string  // Custom Chrome path (auto-detected if not provided)
}
```

## Usage Guide

### Basic Workflow

1. **List Available Tabs**
   ```
   "Show me all browser tabs"
   "What tabs are open?"
   ```

2. **Connect to a Tab**
   ```
   "Connect to the GitHub tab"
   "Connect to tab [ID]"
   ```

3. **Analyze and Debug**
   ```
   "Show console errors"
   "Analyze network performance"
   "Find security issues"
   ```

4. **Disconnect When Done**
   ```
   "Disconnect from the tab"
   ```

### Natural Language Commands

The MCP server understands natural language requests. Here are examples for each category:

#### Console Analysis
- "Show all console errors"
- "Search for warnings containing 'deprecated'"
- "Find console messages matching /api.*error/i"
- "Analyze patterns in console logs"

#### Network Monitoring
- "Show failed network requests"
- "List slow API calls over 1 second"
- "Find all POST requests to /api"
- "Export network traffic as HAR"

#### Performance Analysis
- "Analyze page performance"
- "Find performance bottlenecks"
- "Show network timing statistics"
- "Which requests are slowing down the page?"

#### Security Scanning
- "Check for security vulnerabilities"
- "Are there any exposed API keys?"
- "Scan for mixed content issues"
- "Find potential XSS vulnerabilities"

#### Error Debugging
- "Correlate console errors with network failures"
- "Find the root cause of errors"
- "Show related errors within 5 seconds"

## API Reference

### Tools Overview

The server provides 15 tools across 6 categories:

#### Browser Management Tools

##### `browser_launch`
Launches a new Chrome instance with debugging enabled.

**Input**:
```typescript
{
  executablePath?: string  // Optional custom Chrome path
}
```

**Output**:
```typescript
{
  success: boolean
  port: number
  message: string
}
```

##### `browser_list_tabs`
Lists all available browser tabs.

**Input**:
```typescript
{
  host?: string  // Default: "localhost"
  port?: number  // Default: 9222
}
```

**Output**:
```typescript
{
  tabs: Array<{
    id: string
    title: string
    url: string
    type: string
  }>
}
```

##### `browser_connect`
Connects to a specific browser tab.

**Input**:
```typescript
{
  tabId: string     // Required tab ID
  host?: string     // Default: "localhost"
  port?: number     // Default: 9222
}
```

**Output**:
```typescript
{
  success: boolean
  tabId: string
  message: string
}
```

##### `browser_disconnect`
Disconnects from a browser tab.

**Input**:
```typescript
{
  tabId: string  // Required tab ID
}
```

**Output**:
```typescript
{
  success: boolean
  message: string
}
```

#### Console Analysis Tools

##### `console_search`
Basic console message search with filtering.

**Input**:
```typescript
{
  tabId: string                                    // Required
  pattern?: string                                 // Search text
  level?: Array<'log'|'info'|'warn'|'error'|'debug'>  // Filter levels
  limit?: number                                   // Max results (default: 100)
  regex?: boolean                                  // Treat pattern as regex
}
```

**Output**:
```typescript
{
  messages: Array<{
    timestamp: number
    level: string
    text: string
    source?: string
    lineNumber?: number
    stackTrace?: string
  }>
  total: number
  filtered: number
}
```

##### `console_advanced_search`
Advanced console search with pattern matching and correlation.

**Input**:
```typescript
{
  tabId: string
  patterns?: {
    include?: string[]     // Patterns to include
    exclude?: string[]     // Patterns to exclude
    mode?: 'any' | 'all'   // Match mode (default: 'any')
  }
  namedPatterns?: Record<string, string>  // Named regex patterns
  correlate?: {
    fields?: string[]      // Fields to group by
    timeWindow?: number    // Time window in ms
  }
  includeStats?: boolean   // Include statistics (default: true)
}
```

**Output**:
```typescript
{
  results: Array<ConsoleMessage>
  stats?: {
    total: number
    byLevel: Record<string, number>
    patterns: Record<string, number>
    timeline: Array<{time: string, count: number}>
  }
  correlations?: Array<{
    pattern: string
    messages: Array<ConsoleMessage>
    count: number
  }>
}
```

#### Network Monitoring Tools

##### `network_analyze`
Analyzes network requests with advanced filtering.

**Input**:
```typescript
{
  tabId: string
  urlPattern?: string      // Regex pattern for URLs
  method?: Array<'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'HEAD'|'OPTIONS'>
  statusCode?: number[]    // Specific status codes
  statusRange?: {          // Status code range
    min?: number
    max?: number
  }
  minDuration?: number     // Min response time (ms)
  limit?: number           // Max results (default: 100)
}
```

**Output**:
```typescript
{
  requests: Array<{
    requestId: string
    url: string
    method: string
    status: number
    mimeType: string
    duration: number
    size: number
    timestamp: number
    timing: {
      dns?: number
      connect?: number
      ssl?: number
      send?: number
      wait?: number
      receive?: number
    }
  }>
  summary: {
    total: number
    failed: number
    avgDuration: number
    totalSize: number
  }
}
```

##### `network_performance`
Gets network performance statistics.

**Input**:
```typescript
{
  tabId: string  // Required tab ID
}
```

**Output**:
```typescript
{
  summary: {
    totalRequests: number
    failedRequests: number
    totalSize: number
    totalDuration: number
    avgDuration: number
  }
  byType: Record<string, {
    count: number
    size: number
    avgDuration: number
  }>
  byStatus: Record<string, number>
  slowestRequests: Array<NetworkRequest>
  largestRequests: Array<NetworkRequest>
}
```

##### `network_export_har`
Exports network traffic in HAR format.

**Input**:
```typescript
{
  tabId: string
  includeResponseBodies?: boolean  // Include response content (default: false)
}
```

**Output**:
```typescript
{
  har: {
    version: string
    creator: object
    pages: Array<object>
    entries: Array<object>
  }
}
```

#### AI-Enhanced Debugging Tools

##### `error_correlate`
Correlates errors between console and network.

**Input**:
```typescript
{
  tabId: string
  timeWindow?: number           // Correlation window (ms, default: 5000)
  minSeverity?: 'low'|'medium'|'high'  // Min severity (default: 'low')
}
```

**Output**:
```typescript
{
  correlations: Array<{
    error: ConsoleMessage
    relatedNetworkFailures: Array<NetworkRequest>
    relatedConsoleErrors: Array<ConsoleMessage>
    severity: string
    analysis: string
  }>
  summary: {
    totalErrors: number
    correlatedErrors: number
    topPatterns: Array<{pattern: string, count: number}>
  }
}
```

##### `security_scan`
Scans for security vulnerabilities.

**Input**:
```typescript
{
  tabId: string
  includeRecommendations?: boolean  // Include fixes (default: true)
}
```

**Output**:
```typescript
{
  vulnerabilities: Array<{
    type: string
    severity: 'low'|'medium'|'high'|'critical'
    description: string
    evidence: object
    recommendation?: string
  }>
  summary: {
    total: number
    bySeverity: Record<string, number>
    categories: string[]
  }
}
```

##### `log_analyze`
AI-powered log analysis for patterns and insights.

**Input**:
```typescript
{
  tabId: string
  includeAllInsights?: boolean  // Include low-confidence insights (default: false)
}
```

**Output**:
```typescript
{
  insights: Array<{
    type: string
    title: string
    description: string
    confidence: number
    evidence: Array<object>
    recommendation?: string
  }>
  patterns: Array<{
    pattern: string
    frequency: number
    severity: string
    examples: Array<string>
  }>
  anomalies: Array<{
    type: string
    description: string
    timestamp: number
    context: object
  }>
}
```

##### `performance_profile`
Advanced performance profiling with recommendations.

**Input**:
```typescript
{
  tabId: string
  includeRecommendations?: boolean  // Include optimization tips (default: true)
  includeWaterfall?: boolean        // Include timing visualization (default: true)
}
```

**Output**:
```typescript
{
  metrics: {
    pageLoad: number
    domContentLoaded: number
    firstPaint?: number
    firstContentfulPaint?: number
    requests: {
      total: number
      size: number
      duration: number
    }
  }
  bottlenecks: Array<{
    type: string
    impact: 'low'|'medium'|'high'
    description: string
    affectedRequests: Array<NetworkRequest>
  }>
  recommendations?: Array<{
    category: string
    priority: number
    suggestion: string
    potentialImpact: string
  }>
  waterfall?: Array<{
    url: string
    start: number
    duration: number
    timing: object
  }>
}
```

## Common Use Cases

### 1. Debugging JavaScript Errors

```
User: "I'm seeing errors on my website. Can you help debug?"

Assistant will:
1. List available tabs
2. Connect to your website tab
3. Search for console errors
4. Correlate with network failures
5. Provide root cause analysis
```

### 2. Performance Optimization

```
User: "My page is loading slowly. What's causing it?"

Assistant will:
1. Connect to the page
2. Run performance profiling
3. Identify bottlenecks
4. Analyze slow network requests
5. Provide optimization recommendations
```

### 3. API Debugging

```
User: "My API calls are failing intermittently"

Assistant will:
1. Connect to the application
2. Monitor network requests
3. Filter for failed API calls
4. Analyze patterns in failures
5. Check console for related errors
```

### 4. Security Audit

```
User: "Check my site for security issues"

Assistant will:
1. Connect to your site
2. Run security scan
3. Check for exposed secrets
4. Identify vulnerabilities
5. Provide remediation steps
```

### 5. Real-time Monitoring

```
User: "Monitor my app while I reproduce a bug"

Assistant will:
1. Connect to the tab
2. Start monitoring console and network
3. Watch for errors as you interact
4. Capture relevant data
5. Analyze the issue when it occurs
```

#### Backend Debugging Tools (NEW!)

##### `backend_logs_stream`
Streams and searches logs from backend applications.

**Input**:
```typescript
{
  source: 'file'|'process'|'docker'|'stdout'  // Log source type
  target: string                              // File path, process ID, container ID, or command
  filters?: {
    level?: string[]                          // Filter by log levels
    pattern?: string                          // Search pattern
    regex?: boolean                           // Treat pattern as regex
    since?: string                           // ISO timestamp to start from
    limit?: number                           // Max logs to return (default: 1000)
  }
  follow?: boolean                           // Follow log in real-time
  format?: 'json'|'text'|'auto'            // Log format (default: auto)
}
```

**Output**:
```typescript
{
  success: boolean
  source: string
  target: string
  logCount: number
  logs: Array<{
    timestamp: string
    level?: string
    message: string
    metadata?: object
    source: string
    raw: string
  }>
  streaming: boolean
}
```

##### `backend_debugger_attach`
Attaches to a Node.js process for debugging.

**Input**:
```typescript
{
  host?: string      // Debug host (default: localhost)
  port: number       // Debug port (e.g., 9229 for Node.js)
  processId?: string // Optional process ID
  type?: 'node'|'deno'|'chrome'  // Runtime type (default: node)
}
```

**Output**:
```typescript
{
  success: boolean
  debugger: {
    connected: boolean
    target: {
      id: string
      title: string
      type: string
      url: string
    }
    runtime: object
    capabilities: {
      debugging: boolean
      profiling: boolean
      heapSnapshot: boolean
      coverage: boolean
    }
  }
  message: string
}
```

## Examples

### Example 1: Debug a React Application

```
User: My React app is showing a white screen. Can you help debug?

AI: I'll help you debug your React app. Let me connect to your browser and analyze what's happening.

[AI will automatically:]
- List browser tabs
- Connect to your React app
- Check console for errors
- Analyze network requests
- Identify the root cause
- Suggest fixes
```

### Example 2: Analyze API Performance

```
User: Our API endpoints are slow. Can you analyze the performance?

AI: I'll analyze your API performance. Let me connect and examine the network traffic.

[AI will automatically:]
- Connect to your application
- Filter network requests for API calls
- Calculate response times
- Identify slow endpoints
- Provide optimization suggestions
```

### Example 3: Find Memory Leaks

```
User: I think my app has a memory leak. Can you help find it?

AI: I'll help identify potential memory leaks. Let me analyze your console logs and patterns.

[AI will automatically:]
- Connect to your app
- Monitor console patterns
- Look for repeated error messages
- Analyze object creation patterns
- Suggest memory leak sources
```

### Example 4: Export Network Data

```
User: I need to share the network traffic with my team

AI: I'll export the network traffic as a HAR file that you can share.

[AI will automatically:]
- Connect to the tab
- Capture current network data
- Export as HAR format
- Provide the exported data
```

### Example 5: Backend Log Analysis (NEW!)

```
User: Analyze the errors in my server logs

AI: I'll help you analyze your server logs. Let me connect to your log file and search for errors.

[AI will automatically:]
- Stream logs from your specified file
- Filter for error-level messages
- Parse log formats (JSON/text)
- Identify error patterns
- Provide insights and recommendations
```

### Example 6: Full-Stack Debugging (NEW!)

```
User: My API is returning 500 errors intermittently

AI: I'll investigate this issue by examining both frontend and backend. Let me start with the browser to see the errors.

[AI will automatically:]
- Connect to your browser tab
- Monitor network requests for 500 errors
- Stream backend logs to find corresponding errors
- Correlate frontend and backend issues
- Identify the root cause
- Suggest fixes
```

## Troubleshooting

### Common Issues

#### 1. "No browser tabs found"

**Cause**: Chrome not running with debugging enabled  
**Solution**: Launch Chrome with `--remote-debugging-port=9222`

#### 2. "Failed to connect to tab"

**Cause**: Tab already connected or closed  
**Solution**: Disconnect from any existing connections, refresh the tab

#### 3. "MCP server not available in AI assistant"

**Cause**: Configuration not loaded  
**Solution**: 
1. Verify config file location
2. Check JSON syntax
3. Restart your AI assistant application

#### 4. "Chrome path not found"

**Cause**: Non-standard Chrome installation  
**Solution**: Specify custom path in browser_launch:
```json
{
  "executablePath": "/custom/path/to/chrome"
}
```

#### 5. "Cannot connect to Node.js debugger"

**Cause**: Node.js not started with debugging enabled  
**Solution**: Start your Node.js app with the `--inspect` flag:
```bash
node --inspect=9229 app.js
```

#### 6. "Log file not found"

**Cause**: Incorrect file path or permissions  
**Solution**: 
1. Use absolute paths for log files
2. Check file exists and has read permissions
3. Ensure the process is writing logs to the expected location

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npx browser-connect-mcp
```

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/perception30/browser-connect-mcp/issues)
- **Documentation**: Check this guide and README
- **Examples**: See the Examples section above

## Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/perception30/browser-connect-mcp/blob/main/CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/perception30/browser-connect-mcp.git
cd browser-connect-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](https://github.com/perception30/browser-connect-mcp/blob/main/LICENSE) for details.

## Author

**Khaled Bin A Quadir**  
Email: kahled.binaquadir@gmail.com  
GitHub: [@perception30](https://github.com/perception30)

---

For more information about Model Context Protocol, visit the [MCP documentation](https://modelcontextprotocol.io/docs).