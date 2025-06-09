# Browser Connect MCP - API Usage Examples

This guide demonstrates how to communicate with the Browser Connect MCP server for various debugging scenarios.

## Table of Contents

1. [Basic Connection Flow](#basic-connection-flow)
2. [Console Debugging Examples](#console-debugging-examples)
3. [Network Analysis Examples](#network-analysis-examples)
4. [Advanced Debugging Examples](#advanced-debugging-examples)
5. [Complete Workflow Examples](#complete-workflow-examples)

## Basic Connection Flow

### 1. Launch Browser and Connect

```javascript
// Request: Launch Chrome with debugging
{
  "tool": "browser_launch",
  "arguments": {
    "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "url": "http://localhost:3000",
    "debugPort": 9222
  }
}

// Response:
{
  "success": true,
  "port": 9222,
  "message": "Browser launched with debugging enabled on port 9222 and opened http://localhost:3000"
}
```

### 2. List Available Tabs

```javascript
// Request: Get list of browser tabs
{
  "tool": "browser_list_tabs",
  "arguments": {
    "host": "localhost",
    "port": 9222
  }
}

// Response:
{
  "tabs": [
    {
      "id": "1234-5678-9012",
      "title": "My App - Home",
      "url": "http://localhost:3000",
      "type": "page"
    },
    {
      "id": "2345-6789-0123",
      "title": "GitHub",
      "url": "https://github.com",
      "type": "page"
    }
  ]
}
```

### 3. Connect to a Tab

```javascript
// Request: Connect to specific tab
{
  "tool": "browser_connect",
  "arguments": {
    "tabId": "1234-5678-9012",
    "host": "localhost",
    "port": 9222
  }
}

// Response:
{
  "success": true,
  "tabId": "1234-5678-9012",
  "message": "Successfully connected to tab: My App - Home"
}
```

### 4. Quick Debug Localhost

```javascript
// Request: Launch and auto-connect to localhost
{
  "tool": "debug_localhost",
  "arguments": {
    "port": 3000,
    "path": "/dashboard",
    "protocol": "http",
    "debugPort": 9222
  }
}

// Response:
{
  "success": true,
  "message": "Successfully launched and connected to http://localhost:3000/dashboard",
  "tabId": "1234-5678-9012",
  "tabTitle": "Dashboard - My App",
  "debugPort": 9222,
  "tip": "You can now use console_search, network_analyze, and other debugging tools with this tabId"
}
```

## Console Debugging Examples

### Basic Console Search

```javascript
// Request: Find all errors
{
  "tool": "console_search",
  "arguments": {
    "tabId": "1234-5678-9012",
    "level": ["error"],
    "limit": 50
  }
}

// Response:
{
  "messages": [
    {
      "timestamp": 1699123456789,
      "level": "error",
      "text": "TypeError: Cannot read property 'name' of undefined",
      "source": "app.js",
      "lineNumber": 145,
      "stackTrace": "at getUserName (app.js:145)\n  at renderProfile (app.js:203)"
    }
  ],
  "total": 1,
  "filtered": 1
}
```

### Pattern-Based Search

```javascript
// Request: Search for API-related messages
{
  "tool": "console_search",
  "arguments": {
    "tabId": "1234-5678-9012",
    "pattern": "api|fetch|request",
    "regex": true,
    "limit": 100
  }
}

// Response:
{
  "messages": [
    {
      "timestamp": 1699123456000,
      "level": "info",
      "text": "API request: GET /api/users",
      "source": "api-client.js",
      "lineNumber": 45
    },
    {
      "timestamp": 1699123457000,
      "level": "error",
      "text": "API request failed: 401 Unauthorized",
      "source": "api-client.js",
      "lineNumber": 52
    }
  ],
  "total": 2,
  "filtered": 2
}
```

### Advanced Console Analysis

```javascript
// Request: Advanced pattern matching with correlation
{
  "tool": "console_advanced_search",
  "arguments": {
    "tabId": "1234-5678-9012",
    "patterns": {
      "include": ["error", "failed", "exception"],
      "exclude": ["deprecation"],
      "mode": "any"
    },
    "namedPatterns": {
      "apiError": "API.*(?:error|failed)",
      "authError": "(?:auth|login|401|403)",
      "networkError": "(?:fetch|xhr|network).*(?:fail|error)"
    },
    "correlate": {
      "fields": ["source", "level"],
      "timeWindow": 5000
    },
    "includeStats": true
  }
}

// Response:
{
  "results": [
    {
      "timestamp": 1699123456789,
      "level": "error",
      "text": "API authentication failed: 401",
      "matchedPatterns": ["apiError", "authError"]
    }
  ],
  "stats": {
    "total": 15,
    "byLevel": {
      "error": 8,
      "warn": 5,
      "info": 2
    },
    "patterns": {
      "apiError": 5,
      "authError": 3,
      "networkError": 2
    },
    "timeline": [
      { "time": "10:00-10:05", "count": 3 },
      { "time": "10:05-10:10", "count": 12 }
    ]
  },
  "correlations": [
    {
      "pattern": "Authentication errors",
      "messages": [/* correlated messages */],
      "count": 3
    }
  ]
}
```

## Network Analysis Examples

### Basic Network Analysis

```javascript
// Request: Find failed requests
{
  "tool": "network_analyze",
  "arguments": {
    "tabId": "1234-5678-9012",
    "statusRange": {
      "min": 400,
      "max": 599
    },
    "limit": 50
  }
}

// Response:
{
  "requests": [
    {
      "requestId": "req-123",
      "url": "https://api.example.com/users",
      "method": "GET",
      "status": 401,
      "mimeType": "application/json",
      "duration": 245,
      "size": 89,
      "timestamp": 1699123456789,
      "timing": {
        "dns": 5,
        "connect": 20,
        "ssl": 15,
        "send": 1,
        "wait": 200,
        "receive": 4
      }
    }
  ],
  "summary": {
    "total": 1,
    "failed": 1,
    "avgDuration": 245,
    "totalSize": 89
  }
}
```

### Performance Analysis

```javascript
// Request: Find slow API calls
{
  "tool": "network_analyze",
  "arguments": {
    "tabId": "1234-5678-9012",
    "urlPattern": "/api/.*",
    "minDuration": 1000,
    "method": ["GET", "POST"],
    "limit": 20
  }
}

// Response:
{
  "requests": [
    {
      "requestId": "req-456",
      "url": "https://api.example.com/api/reports/generate",
      "method": "POST",
      "status": 200,
      "duration": 3456,
      "size": 125000,
      "timing": {
        "wait": 3400,
        "receive": 56
      }
    }
  ],
  "summary": {
    "total": 1,
    "failed": 0,
    "avgDuration": 3456,
    "totalSize": 125000
  }
}
```

### Network Performance Stats

```javascript
// Request: Get overall network performance
{
  "tool": "network_performance",
  "arguments": {
    "tabId": "1234-5678-9012"
  }
}

// Response:
{
  "summary": {
    "totalRequests": 142,
    "failedRequests": 5,
    "totalSize": 3456789,
    "totalDuration": 45678,
    "avgDuration": 321
  },
  "byType": {
    "xhr": {
      "count": 45,
      "size": 1234567,
      "avgDuration": 456
    },
    "script": {
      "count": 20,
      "size": 2000000,
      "avgDuration": 234
    },
    "image": {
      "count": 50,
      "size": 200000,
      "avgDuration": 123
    }
  },
  "byStatus": {
    "200": 130,
    "304": 7,
    "401": 3,
    "500": 2
  },
  "slowestRequests": [/* top 10 slowest */],
  "largestRequests": [/* top 10 largest */]
}
```

### Export Network Traffic

```javascript
// Request: Export as HAR
{
  "tool": "network_export_har",
  "arguments": {
    "tabId": "1234-5678-9012",
    "includeResponseBodies": true
  }
}

// Response:
{
  "har": {
    "version": "1.2",
    "creator": {
      "name": "Browser Connect MCP",
      "version": "0.1.1"
    },
    "pages": [
      {
        "startedDateTime": "2023-11-04T10:00:00.000Z",
        "id": "page_1",
        "title": "My App"
      }
    ],
    "entries": [
      {
        "startedDateTime": "2023-11-04T10:00:01.000Z",
        "request": {
          "method": "GET",
          "url": "https://api.example.com/users",
          "headers": [/* headers */]
        },
        "response": {
          "status": 200,
          "content": {/* response content */}
        },
        "timings": {/* detailed timings */}
      }
    ]
  }
}
```

## Advanced Debugging Examples

### Error Correlation

```javascript
// Request: Correlate errors between console and network
{
  "tool": "error_correlate",
  "arguments": {
    "tabId": "1234-5678-9012",
    "timeWindow": 5000,
    "minSeverity": "medium"
  }
}

// Response:
{
  "correlations": [
    {
      "error": {
        "timestamp": 1699123456789,
        "level": "error",
        "text": "Failed to fetch user data"
      },
      "relatedNetworkFailures": [
        {
          "url": "https://api.example.com/users/123",
          "status": 404,
          "timestamp": 1699123456700
        }
      ],
      "relatedConsoleErrors": [
        {
          "text": "TypeError: Cannot read property 'name' of undefined",
          "timestamp": 1699123456800
        }
      ],
      "severity": "high",
      "analysis": "Console error appears to be caused by failed API request returning 404"
    }
  ],
  "summary": {
    "totalErrors": 15,
    "correlatedErrors": 8,
    "topPatterns": [
      { "pattern": "Authentication failures", "count": 3 },
      { "pattern": "Missing data errors", "count": 5 }
    ]
  }
}
```

### Security Scan

```javascript
// Request: Scan for security issues
{
  "tool": "security_scan",
  "arguments": {
    "tabId": "1234-5678-9012",
    "includeRecommendations": true
  }
}

// Response:
{
  "vulnerabilities": [
    {
      "type": "exposed_api_key",
      "severity": "critical",
      "description": "API key exposed in console log",
      "evidence": {
        "message": "GitHub API Key: ghp_xxxxxxxxxxxx",
        "source": "app.js",
        "line": 234
      },
      "recommendation": "Remove console.log statements containing sensitive data and use environment variables"
    },
    {
      "type": "mixed_content",
      "severity": "medium",
      "description": "HTTP resource loaded on HTTPS page",
      "evidence": {
        "url": "http://cdn.example.com/script.js",
        "page": "https://myapp.com"
      },
      "recommendation": "Use HTTPS URLs for all external resources"
    }
  ],
  "summary": {
    "total": 2,
    "bySeverity": {
      "critical": 1,
      "medium": 1
    },
    "categories": ["data_exposure", "transport_security"]
  }
}
```

### Performance Profiling

```javascript
// Request: Profile page performance
{
  "tool": "performance_profile",
  "arguments": {
    "tabId": "1234-5678-9012",
    "includeRecommendations": true,
    "includeWaterfall": true
  }
}

// Response:
{
  "metrics": {
    "pageLoad": 3456,
    "domContentLoaded": 1234,
    "firstPaint": 456,
    "firstContentfulPaint": 789,
    "requests": {
      "total": 45,
      "size": 2345678,
      "duration": 2500
    }
  },
  "bottlenecks": [
    {
      "type": "large_resource",
      "impact": "high",
      "description": "Uncompressed JavaScript bundle (1.2MB)",
      "affectedRequests": [
        {
          "url": "https://myapp.com/js/bundle.js",
          "size": 1234567,
          "duration": 1500
        }
      ]
    },
    {
      "type": "render_blocking",
      "impact": "medium",
      "description": "CSS loaded synchronously in <head>",
      "affectedRequests": [/* CSS files */]
    }
  ],
  "recommendations": [
    {
      "category": "resource_optimization",
      "priority": 1,
      "suggestion": "Enable gzip compression for JavaScript files",
      "potentialImpact": "Reduce bundle size by ~70%, save 800ms load time"
    },
    {
      "category": "loading_strategy",
      "priority": 2,
      "suggestion": "Load non-critical CSS asynchronously",
      "potentialImpact": "Improve First Contentful Paint by ~300ms"
    }
  ],
  "waterfall": [
    {
      "url": "https://myapp.com/",
      "start": 0,
      "duration": 234,
      "timing": {/* detailed timing */}
    }
    // ... more requests in chronological order
  ]
}
```

### AI-Powered Log Analysis

```javascript
// Request: Analyze logs for insights
{
  "tool": "log_analyze",
  "arguments": {
    "tabId": "1234-5678-9012",
    "includeAllInsights": false
  }
}

// Response:
{
  "insights": [
    {
      "type": "error_pattern",
      "title": "Authentication Token Expiration",
      "description": "Multiple 401 errors occurring after ~1 hour suggests token expiration issue",
      "confidence": 0.85,
      "evidence": [
        { "timestamp": 1699120000000, "message": "Login successful" },
        { "timestamp": 1699123600000, "message": "API call failed: 401" }
      ],
      "recommendation": "Implement token refresh logic before expiration"
    },
    {
      "type": "performance_issue",
      "title": "Memory Leak Detected",
      "description": "Repeated object creation without cleanup in event handlers",
      "confidence": 0.75,
      "evidence": [/* console messages showing pattern */],
      "recommendation": "Add cleanup in componentWillUnmount or use WeakMap"
    }
  ],
  "patterns": [
    {
      "pattern": "Failed to load resource",
      "frequency": 23,
      "severity": "high",
      "examples": [
        "Failed to load resource: net::ERR_CONNECTION_REFUSED",
        "Failed to load resource: 404 Not Found"
      ]
    }
  ],
  "anomalies": [
    {
      "type": "spike",
      "description": "Sudden increase in error rate at 10:45 AM",
      "timestamp": 1699123500000,
      "context": {
        "normalRate": 2,
        "spikeRate": 45,
        "duration": 300000
      }
    }
  ]
}
```

## Complete Workflow Examples

### Workflow 1: Debug React Application

```javascript
// Step 1: Launch and connect
{
  "tool": "debug_localhost",
  "arguments": {
    "port": 3000,
    "path": "/",
    "protocol": "http"
  }
}

// Step 2: Check for errors
{
  "tool": "console_search",
  "arguments": {
    "tabId": "1234-5678-9012",
    "level": ["error", "warn"],
    "limit": 100
  }
}

// Step 3: Analyze related network failures
{
  "tool": "error_correlate",
  "arguments": {
    "tabId": "1234-5678-9012",
    "timeWindow": 5000
  }
}

// Step 4: Get performance metrics
{
  "tool": "performance_profile",
  "arguments": {
    "tabId": "1234-5678-9012",
    "includeRecommendations": true
  }
}

// Step 5: Export data for team
{
  "tool": "network_export_har",
  "arguments": {
    "tabId": "1234-5678-9012",
    "includeResponseBodies": false
  }
}

// Step 6: Disconnect
{
  "tool": "browser_disconnect",
  "arguments": {
    "tabId": "1234-5678-9012"
  }
}
```

### Workflow 2: API Integration Debugging

```javascript
// Step 1: Connect to existing tab
{
  "tool": "browser_list_tabs",
  "arguments": {}
}

{
  "tool": "browser_connect",
  "arguments": {
    "tabId": "existing-tab-id"
  }
}

// Step 2: Monitor API calls
{
  "tool": "network_analyze",
  "arguments": {
    "tabId": "existing-tab-id",
    "urlPattern": "/api/.*",
    "limit": 200
  }
}

// Step 3: Check for API errors
{
  "tool": "console_advanced_search",
  "arguments": {
    "tabId": "existing-tab-id",
    "namedPatterns": {
      "apiError": "(?:api|fetch).*(?:error|failed)",
      "statusCode": "\\b(4\\d{2}|5\\d{2})\\b"
    }
  }
}

// Step 4: Security check
{
  "tool": "security_scan",
  "arguments": {
    "tabId": "existing-tab-id"
  }
}
```

### Workflow 3: Production Issue Investigation

```javascript
// Step 1: Connect to production site
{
  "tool": "browser_launch",
  "arguments": {
    "url": "https://production.example.com",
    "debugPort": 9222
  }
}

// Step 2: Get AI insights
{
  "tool": "log_analyze",
  "arguments": {
    "tabId": "tab-id",
    "includeAllInsights": true
  }
}

// Step 3: Performance analysis
{
  "tool": "network_performance",
  "arguments": {
    "tabId": "tab-id"
  }
}

// Step 4: Detailed error correlation
{
  "tool": "error_correlate",
  "arguments": {
    "tabId": "tab-id",
    "timeWindow": 10000,
    "minSeverity": "low"
  }
}
```

## Best Practices

1. **Always connect before debugging**: Use `browser_connect` or `debug_localhost` first
2. **Use appropriate filters**: Limit results to relevant data with patterns and filters
3. **Correlate errors**: Use `error_correlate` to find root causes
4. **Export for sharing**: Use `network_export_har` to share debugging data
5. **Disconnect when done**: Always call `browser_disconnect` to clean up resources
6. **Use natural language with your AI**: These examples show the underlying API, but AI assistants understand natural language requests

## Error Handling

All tools return errors in a consistent format:

```javascript
// Error response example
{
  "isError": true,
  "error": "Not connected to tab 1234-5678-9012. Use browser_connect first."
}
```

Common errors:
- `Not connected to tab`: Connect to tab before using analysis tools
- `No browser tabs found`: Launch Chrome with debugging enabled
- `Tab not found`: Tab may have been closed, list tabs again
- `Connection failed`: Tab might be busy, refresh and retry