# Browser Connect MCP

A Model Context Protocol (MCP) server that enables Claude to connect to browser DevTools for debugging web applications. Simply ask Claude to help debug your website, and it will handle all the technical details!

## What is this?

Browser Connect MCP gives Claude the ability to:
- 🚀 Launch Chrome with debugging enabled automatically
- 🔍 Read console logs and errors from your web pages
- 🌐 Monitor network requests and API calls
- 📊 Analyze performance issues
- 🔒 Scan for security vulnerabilities
- 🤖 Provide intelligent debugging insights

All through natural conversation - no coding required!

## Quick Start

### 1. Install via npx (Recommended - No Installation Required!)

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### 2. Restart Claude Desktop

After saving the configuration, restart Claude Desktop to load the browser debugging capabilities.

### 3. Start Debugging!

Just talk to Claude naturally:

```
You: "Help me debug my website at localhost:3000"

Claude: I'll help you debug your website. Let me launch Chrome with debugging enabled 
and connect to it.

[Claude launches Chrome and connects automatically]

Now I'm connected to your browser. I can see the console messages and network traffic. 
What specific issues are you experiencing?

You: "The page is loading slowly"

Claude: Let me analyze the performance of your page...

[Claude automatically runs performance analysis]

I found several performance issues:
1. Large uncompressed images (3.2MB total)
2. Render-blocking JavaScript in the header
3. Multiple API calls that could be batched

Would you like me to investigate any of these issues in detail?
```

## What Can You Ask Claude?

### Debugging Requests

- **"Launch Chrome and help me debug my website"**
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

## Real-World Examples

### Example 1: Debugging API Errors

```
You: "My app isn't working, can you help debug it?"

Claude: I'll help you debug your app. Let me connect to your browser and see what's happening.

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

Claude: I'll analyze the checkout page performance. Let me connect to your browser and load the checkout page.

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

Claude: I'll run a comprehensive security scan on your application.

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

## Common Debugging Workflows

### Complete Debugging Session

```
You: "I need help debugging my React app"

Claude will automatically:
1. Launch Chrome with debugging enabled
2. Navigate to your app
3. Start monitoring console and network
4. Provide insights on any issues found
```

### Quick Error Check

```
You: "Are there any errors on my website?"

Claude will:
1. Connect to your browser
2. Search for all error-level messages
3. Analyze error patterns
4. Suggest fixes
```

### API Debugging

```
You: "Help me debug why my API calls are failing"

Claude will:
1. Monitor network traffic
2. Identify failed requests
3. Analyze request/response details
4. Identify patterns in failures
```

## Features

### 🔌 Browser Management
- **Automatic Chrome Launch**: Claude launches Chrome with debugging enabled - no manual setup!
- **Tab Discovery**: Find and connect to existing browser tabs
- **Smart Connection**: Maintains connection throughout debugging session

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
- **Automatic Analysis**: Claude proactively identifies issues
- **Root Cause Detection**: Find the source of cascading errors
- **Performance Recommendations**: Get optimization suggestions
- **Security Scanning**: Detect vulnerabilities automatically

## Alternative Installation Methods

### Global Installation

```bash
npm install -g browser-connect-mcp
```

Then update Claude Desktop config:
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

## Troubleshooting

### "Claude can't connect to my browser"
- Make sure you've restarted Claude Desktop after updating the configuration
- Try asking "Launch a new Chrome browser for debugging"
- Check that Chrome/Chromium is installed on your system

### "No data is appearing"
- Ensure the web page is loaded and active
- Try refreshing the page after Claude connects
- Ask Claude to "Check the connection status"

### "Chrome won't launch"
- The MCP server will try to find Chrome automatically
- If it fails, make sure Chrome or Chromium is installed
- On Linux, you might need to install `chromium-browser`

## How It Works

When you ask Claude to debug your website, this MCP server:

1. **Launches or connects to Chrome** with debugging protocol enabled
2. **Establishes a debugging session** using Chrome DevTools Protocol
3. **Monitors console and network events** in real-time
4. **Provides Claude with debugging data** to analyze and help you
5. **Maintains context** throughout your debugging conversation

All of this happens automatically - you just describe what you need!

## Privacy & Security

- **Local Only**: All debugging happens on your local machine
- **No Data Storage**: Information is only kept during the active session
- **Secure by Default**: Uses Chrome DevTools Protocol securely
- **Permission-Based**: Claude asks before performing actions

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/perception30/browser-connect-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/perception30/browser-connect-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/perception30/browser-connect-mcp/wiki)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- Powered by [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- Inspired by developers who need better debugging tools

---

**Made with ❤️ for developers who want to debug with AI assistance**