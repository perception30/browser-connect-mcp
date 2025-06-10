# Browser Connect MCP

[![npm version](https://img.shields.io/npm/v/browser-connect-mcp.svg)](https://www.npmjs.com/package/browser-connect-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/browser-connect-mcp.svg)](https://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dm/browser-connect-mcp.svg)](https://www.npmjs.com/package/browser-connect-mcp)

A Model Context Protocol (MCP) server that enables AI assistants to connect to browser DevTools and backend debuggers for comprehensive full-stack debugging. Works with any MCP-compatible tool including Claude Desktop, Claude Code, Cursor, Cline, Roo-Cline, and more!

## What is this?

Browser Connect MCP gives AI assistants the ability to:

**Frontend Debugging:**
- 🚀 Launch Chrome with debugging enabled automatically
- 🔍 Read console logs and errors from your web pages
- 🌐 Monitor network requests and API calls
- 📊 Analyze performance issues
- 🔒 Scan for security vulnerabilities

**Backend Debugging (NEW!):**
- 📝 Stream and analyze backend logs in real-time
- 🐛 Attach to Node.js debuggers for breakpoint debugging
- 🐳 Monitor Docker container logs
- 📁 Parse structured and unstructured log files
- 🔍 Search and filter logs with pattern matching

**AI-Powered Analysis:**
- 🤖 Intelligent error correlation between frontend and backend
- 💡 Root cause analysis across the full stack
- 🎯 Performance bottleneck detection
- 🛡️ Security vulnerability scanning

All through natural conversation - no coding required!

## Quick Start

### 1. Install via npx (Recommended - No Installation Required!)

Add to your AI assistant's MCP configuration. Here are examples for popular tools:

**IMPORTANT:** Due to how MCP clients handle spawning commands, you MUST use the following configuration format with `npx` as the command and the package name as an argument:

**Claude Desktop** (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "browser-connect": {
      "command": "npx",
      "args": ["-y", "browser-connect-mcp@0.4.1"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Note:** The `-y` flag ensures npx runs without prompting, and the version ensures you're using the latest stable release.

**Cursor/Cline/Other MCP Tools**: Check your tool's documentation for MCP server configuration location.

### 2. Restart Your AI Assistant

After saving the configuration, restart your AI assistant application to load the browser debugging capabilities.

### 3. Start Debugging!

Just talk to your AI assistant naturally:

```
You: "Help me debug my website at localhost:3000"

AI: I'll help you debug your website. Let me launch Chrome with debugging enabled 
and connect to it.

[AI launches Chrome and connects automatically]

Now I'm connected to your browser. I can see the console messages and network traffic. 
What specific issues are you experiencing?

You: "The page is loading slowly"

AI: Let me analyze the performance of your page...

[AI automatically runs performance analysis]

I found several performance issues:
1. Large uncompressed images (3.2MB total)
2. Render-blocking JavaScript in the header
3. Multiple API calls that could be batched

Would you like me to investigate any of these issues in detail?
```

## Compatible AI Assistants

This MCP server works with any tool that supports the Model Context Protocol:

- **Claude Desktop** - Anthropic's official desktop app
- **Claude Code** - Anthropic's CLI for developers
- **Cursor** - AI-powered code editor
- **Cline** - Command-line AI assistant
- **Roo-Cline** - Enhanced version of Cline
- **Any MCP-compatible IDE or platform**

## What Can You Ask Your AI Assistant?

### Debugging Requests

- **"Launch Chrome and help me debug my website"**
- **"Debug my app running on localhost:3000"** - Automatically launches and connects
- **"Open localhost:8080 in my default browser"** - Opens in your preferred browser
- **"Connect to my existing Chrome browser"**
- **"Show me any JavaScript errors"**
- **"Are there any failed API calls?"**
- **"Why is my page loading slowly?"**
- **"Check for security vulnerabilities"**
- **"Find memory leaks"**
- **"Debug CORS issues"**
- **"Export network traffic for analysis"**

### Performance Analysis

- **"Analyze the performance of this page"**
- **"Which requests are taking the longest?"**
- **"Find performance bottlenecks"**
- **"Show me the slowest API endpoints"**

### Error Investigation

- **"What errors are happening?"**
- **"Find all TypeErrors in the console"**
- **"Show me errors related to authentication"**
- **"Are these errors related to each other?"**

### Security Checks

- **"Run a security scan"**
- **"Check if any sensitive data is exposed"**
- **"Look for security vulnerabilities"**
- **"Are there any insecure requests?"**

### Backend Debugging

- **"Stream logs from my Node.js server"**
- **"Show me backend errors from server.log"**
- **"Attach debugger to my Node.js process on port 9229"**
- **"Monitor my Docker container logs"**
- **"Find all database errors in the backend logs"**
- **"Correlate frontend errors with backend logs"**
- **"Show me slow API endpoints from backend logs"**

## Real-World Examples

### Example 1: Debugging API Errors

```
You: "My app isn't working, can you help debug it?"

AI: I'll help you debug your app. Let me connect to your browser and see what's happening.

[Automatically launches/connects to Chrome]

I can see your application. Let me check for any errors...

I found several issues:
1. API calls to /api/user are returning 401 Unauthorized errors
2. There are CORS errors when trying to access the payment service
3. Several "undefined is not a function" errors in your React components

The 401 errors suggest an authentication issue. Would you like me to:
- Look at the request headers to check authentication tokens?
- Find when the authentication errors started?
- Check if there are any related console errors?
```

### Example 2: Performance Optimization

```
You: "Users are complaining the checkout page is slow"

AI: I'll analyze the checkout page performance. Let me connect to your browser and load the checkout page.

[Connects and monitors the page load]

Here's what I found analyzing your checkout page:

Performance Issues:
1. Initial page load: 4.3 seconds (should be under 3s)
2. Largest Contentful Paint: 3.8 seconds
3. Time to Interactive: 5.2 seconds

Main bottlenecks:
- Product images are not optimized (2.1MB total)
- Stripe SDK loads synchronously, blocking render
- 3 sequential API calls that could run in parallel

Recommendations:
1. Compress and lazy-load product images
2. Load Stripe SDK asynchronously
3. Parallelize the API calls

Would you like me to show you the specific network requests causing delays?
```

### Example 3: Security Audit

```
You: "Can you check my app for security issues?"

AI: I'll run a comprehensive security scan on your application.

[Automatically scans console logs and network traffic]

Security Scan Results:

⚠️ High Priority Issues:
1. API keys exposed in console logs (GitHub API key found)
2. User passwords visible in network requests (should use HTTPS)
3. Missing security headers (CSP, X-Frame-Options)

🔍 Medium Priority:
1. Cookies without 'Secure' flag
2. LocalStorage containing sensitive user data
3. Mixed content warnings (HTTP resources on HTTPS page)

✓ Good Security Practices Found:
1. HTTPS enabled on main domain
2. Authentication tokens expire appropriately
3. Input validation on forms

Would you like me to explain how to fix any of these issues?
```

### Example 4: Full-Stack Debugging (NEW!)

```
You: "My users are getting 500 errors but I can't figure out why"

AI: I'll help you debug this issue by examining both frontend and backend. Let me start by connecting to your browser and checking for errors.

[Connects to browser and analyzes network traffic]

I see multiple 500 errors from /api/checkout. Now let me check your backend logs to understand what's happening server-side.

[Streams backend logs]

Found the issue! Here's what's happening:

Frontend (Browser):
- POST /api/checkout returning 500 errors
- Errors started 15 minutes ago
- Affecting 23% of requests

Backend (Server Logs):
- Database connection pool exhausted
- "Error: Connection timeout" in checkout handler
- Memory usage spiking before errors

Root Cause:
Your checkout process isn't closing database connections properly, leading to connection pool exhaustion under load.

Quick Fix:
Add connection.release() after your database queries in the checkout handler.

Long-term Fix:
Implement connection pooling with automatic cleanup and monitoring.
```

## Common Debugging Workflows

### Complete Debugging Session

```
You: "I need help debugging my React app"

Your AI assistant will automatically:
1. Launch Chrome with debugging enabled
2. Navigate to your app
3. Start monitoring console and network
4. Provide insights on any issues found
```

### Quick Error Check

```
You: "Are there any errors on my website?"

Your AI assistant will:
1. Connect to your browser
2. Search for all error-level messages
3. Analyze error patterns
4. Suggest fixes
```

### API Debugging

```
You: "Help me debug why my API calls are failing"

Your AI assistant will:
1. Monitor network traffic
2. Identify failed requests
3. Analyze request/response details
4. Identify patterns in failures
```

### Backend Log Analysis (NEW!)

```
You: "Analyze my server logs for errors"

Your AI assistant will:
1. Connect to your log source (file, process, or Docker)
2. Parse and structure log entries
3. Filter for errors and warnings
4. Identify patterns and anomalies
5. Correlate with frontend issues
```

### Node.js Debugging (NEW!)

```
You: "Debug my Node.js application"

Your AI assistant will:
1. Attach to Node.js debugger (--inspect)
2. Monitor runtime errors and exceptions
3. Analyze performance bottlenecks
4. Track memory usage
5. Provide optimization suggestions
```

## Features

### 🔌 Browser Management
- **Automatic Chrome Launch**: Your AI assistant launches Chrome with debugging enabled - no manual setup!
- **Multi-Browser Support**: Works with Chrome, Chromium, Brave, Edge, and more
- **Default Browser Support**: Can open URLs in your system's default browser
- **Tab Discovery**: Find and connect to existing browser tabs
- **Smart Connection**: Maintains connection throughout debugging session
- **Localhost Debugging**: Special support for debugging localhost applications

### 📝 Console Analysis
- **Error Detection**: Automatically finds JavaScript errors
- **Pattern Matching**: Search logs with intelligent patterns
- **Error Correlation**: Links related errors together
- **Smart Filtering**: Focus on relevant messages

### 🌐 Network Monitoring
- **Request Analysis**: Monitor all HTTP/HTTPS traffic
- **Performance Metrics**: Identify slow requests
- **Error Detection**: Find failed API calls
- **HAR Export**: Export traffic for external analysis

### 🤖 AI-Powered Insights
- **Automatic Analysis**: AI assistants proactively identify issues
- **Root Cause Detection**: Find the source of cascading errors
- **Performance Recommendations**: Get optimization suggestions
- **Security Scanning**: Detect vulnerabilities automatically

### 🖥️ Backend Debugging (NEW!)
- **Log Streaming**: Real-time log monitoring from files, processes, or containers
- **Node.js Debugger**: Attach to Node.js processes with --inspect
- **Log Parsing**: Automatic parsing of JSON and text log formats
- **Pattern Matching**: Advanced filtering with regex support
- **Docker Support**: Monitor container logs directly
- **Process Monitoring**: Track stdout/stderr from running processes

## Alternative Installation Methods

### Global Installation

```bash
npm install -g browser-connect-mcp
```

Then update your AI assistant's config:
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

### From Source

```bash
git clone https://github.com/perception30/browser-connect-mcp.git
cd browser-connect-mcp
npm install
npm run build
```

## Configuration Examples for Different Tools

### Claude Desktop / Claude Code
```json
// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "browser-connect": {
      "command": "npx",
      "args": ["-y", "browser-connect-mcp@0.4.1"]
    }
  }
}
```

**Important:** Always use `npx` as the command with the package name (including version) as arguments. Do NOT use the package name directly as the command - this will cause a "spawn ENOENT" error.

### Cursor IDE
Check Cursor's MCP settings in the preferences/settings panel for adding MCP servers.

### Cline/Roo-Cline
These CLI tools typically use a configuration file like `.cline/config.json`. Consult their documentation for MCP server setup.

### VS Code MCP Extensions
Configuration varies by extension. Look for MCP server settings in the extension's configuration panel.

## Troubleshooting

### "My AI assistant can't connect to my browser"
- Make sure you've restarted your AI assistant application after updating the configuration
- Try asking "Launch a new Chrome browser for debugging"
- Check that Chrome/Chromium is installed on your system

### "No data is appearing"
- Ensure the web page is loaded and active
- Try refreshing the page after your AI assistant connects
- Ask your AI to "Check the connection status"

### "Chrome won't launch"
- The MCP server will try to find Chrome automatically
- If it fails, make sure Chrome or Chromium is installed
- On Linux, you might need to install `chromium-browser`

### "Backend debugging not working"
- For Node.js debugging, ensure your app is started with `--inspect` flag
- Check that log files have read permissions
- For Docker logs, ensure Docker is running and you have permissions
- Verify the debug port (default 9229) is not blocked by firewall

## How It Works

When you ask your AI assistant to debug your application, this MCP server:

**For Frontend Debugging:**
1. **Launches or connects to Chrome** with debugging protocol enabled
2. **Establishes a debugging session** using Chrome DevTools Protocol
3. **Monitors console and network events** in real-time
4. **Captures errors, performance metrics, and security issues**

**For Backend Debugging:**
1. **Connects to log sources** (files, processes, Docker containers)
2. **Attaches to Node.js debuggers** when available
3. **Streams and parses logs** in real-time
4. **Correlates backend issues with frontend errors**

**AI Analysis:**
5. **Provides your AI assistant with comprehensive debugging data**
6. **Enables intelligent analysis across the full stack**
7. **Maintains context** throughout your debugging conversation

All of this happens automatically - you just describe what you need!

## Privacy & Security

- **Local Only**: All debugging happens on your local machine
- **No Data Storage**: Information is only kept during the active session
- **Secure by Default**: Uses Chrome DevTools Protocol securely
- **Permission-Based**: AI assistants ask before performing actions

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- 📚 **[Full NPM Documentation](./docs/NPM_DOCUMENTATION.md)** - Comprehensive guide with all features and API reference
- 🚀 **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Cheat sheet for common commands and workflows
- 🔧 **[API Reference](./docs/NPM_DOCUMENTATION.md#api-reference)** - Detailed tool specifications
- 💡 **[Examples](./docs/NPM_DOCUMENTATION.md#examples)** - Real-world usage examples
- 🔌 **[API Usage Examples](./docs/API_USAGE_EXAMPLES.md)** - Detailed API request/response examples
- 🐛 **[Backend Debugging Best Practices](./docs/BACKEND_DEBUGGING_BEST_PRACTICES.md)** - Guide for debugging backend applications

## Support

- **Issues**: [GitHub Issues](https://github.com/perception30/browser-connect-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/perception30/browser-connect-mcp/discussions)
- **Documentation**: See links above

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- Powered by [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- Inspired by developers who need better debugging tools

---

**Made with ❤️ for developers who want to debug with AI assistance**

## MCP Compatibility

This server implements the Model Context Protocol (MCP) standard, making it compatible with:
- Claude Desktop & Claude Code (Anthropic)
- Cursor IDE
- Cline & Roo-Cline CLI tools
- VS Code extensions supporting MCP
- Any future tools implementing the MCP standard

[Learn more about MCP](https://modelcontextprotocol.io)
