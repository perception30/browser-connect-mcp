# Backend Debugging Best Practices for Browser Connect MCP

## The Challenge

Most developers run their backend apps in a terminal with simple `node app.js` or `npm start`. The challenge is capturing logs from these already-running processes without requiring complex setup or system-level permissions.

## Best Approaches for Normal Users

### 1. **Smart Process Management (Recommended)**

Instead of just reading logs, we should help users start their backend processes in a debug-friendly way:

```javascript
// New tool: backend_process_start
export async function backendProcessStart(args: {
  command: string;           // e.g., "node server.js"
  cwd?: string;             // Working directory
  env?: Record<string, string>;
  debugPort?: number;       // Auto-add --inspect flag
  captureOutput?: boolean;  // Capture stdout/stderr
}) {
  // Start process with proper output capture
  // Automatically add debugging flags
  // Store process reference for later monitoring
}
```

**User Experience:**
```
User: "Start my backend server for debugging"
AI: "I'll start your server with debugging enabled. What's the start command?"
User: "npm start"
AI: [Starts server with debugging and output capture enabled]
```

### 2. **Automatic Log Detection**

Implement smart log file detection:

```javascript
// Enhanced backend_logs_stream
async function detectLogFiles(projectPath: string): Promise<string[]> {
  const commonLogLocations = [
    'logs/',
    '*.log',
    'var/log/',
    'tmp/',
    '.logs/',
    'debug/',
  ];
  
  const commonLogPatterns = [
    'app.log',
    'error.log',
    'debug.log',
    'server.log',
    'access.log',
    'combined.log'
  ];
  
  // Scan for log files
  // Check package.json for log configurations
  // Look for common logging libraries (winston, bunyan, pino)
}
```

### 3. **Framework-Aware Debugging**

Detect and provide framework-specific debugging:

```javascript
interface FrameworkDebugger {
  detect(): Promise<string | null>;
  getDebugCommand(): string;
  getLogLocations(): string[];
  getDebugPort(): number;
}

class ExpressDebugger implements FrameworkDebugger {
  async detect() {
    // Check for express in package.json
    // Look for app.js, server.js patterns
  }
  
  getDebugCommand() {
    return "DEBUG=express:* node --inspect server.js";
  }
}

class NextJSDebugger implements FrameworkDebugger {
  getDebugCommand() {
    return "NODE_OPTIONS='--inspect' next dev";
  }
}

// Support for: Express, Next.js, Nest.js, Fastify, Koa, etc.
```

### 4. **Integrated Terminal Approach**

For already-running processes, provide clear guidance:

```javascript
// New tool: backend_attach_guide
export async function backendAttachGuide(args: {
  processInfo?: string;  // User describes their process
}) {
  // Detect running processes
  const processes = await detectBackendProcesses();
  
  // Provide tailored instructions
  return {
    runningProcesses: processes,
    instructions: [
      "I found your Node.js server running on port 3001",
      "To enable debugging, you'll need to restart it with:",
      `  ${getDebugCommand(processes[0])}`,
      "",
      "Or use our helper command:",
      "  npx browser-connect-mcp start-backend --debug"
    ],
    alternatives: [
      "View existing log files",
      "Attach debugger to running process",
      "Monitor system resources"
    ]
  };
}
```

### 5. **Simplified Log Streaming**

Make log streaming more intuitive:

```javascript
// Enhanced backend_logs_stream with auto-detection
export async function backendLogsStream(args: {
  source?: 'auto' | 'file' | 'process' | 'docker';
  target?: string;  // Optional - auto-detect if not provided
  // ... other args
}) {
  if (args.source === 'auto' || !args.source) {
    // Auto-detect the best source
    const detection = await detectLogSource();
    
    if (detection.logFiles.length > 0) {
      // Found log files
      return streamFromFile(detection.logFiles[0]);
    } else if (detection.runningProcess) {
      // Found running process
      return attachToProcess(detection.runningProcess);
    } else if (detection.dockerContainer) {
      // Found Docker container
      return streamDockerLogs(detection.dockerContainer);
    }
  }
}
```

### 6. **CLI Helper Tool**

Provide a CLI tool to make backend debugging easier:

```bash
#!/usr/bin/env node
# browser-connect-mcp-backend

Commands:
  start <command>    Start a backend process with debugging enabled
  attach <pid>       Attach to a running process
  logs [pattern]     Find and stream log files
  doctor            Diagnose debugging setup

Examples:
  browser-connect-mcp-backend start "npm start"
  browser-connect-mcp-backend start "node server.js" --port 3000
  browser-connect-mcp-backend logs
  browser-connect-mcp-backend attach 12345
```

### 7. **Smart Defaults and Conventions**

Implement intelligent defaults:

```javascript
const SMART_DEFAULTS = {
  // Common start commands
  startCommands: [
    { pattern: /package\.json/, command: 'npm start' },
    { pattern: /server\.[jt]s/, command: 'node server.js' },
    { pattern: /app\.[jt]s/, command: 'node app.js' },
    { pattern: /index\.[jt]s/, command: 'node index.js' },
  ],
  
  // Common log locations
  logPatterns: [
    { framework: 'express', locations: ['logs/', 'morgan.log'] },
    { framework: 'nestjs', locations: ['logs/', 'nest.log'] },
    { framework: 'pm2', locations: ['~/.pm2/logs/'] },
  ],
  
  // Debug ports
  debugPorts: {
    default: 9229,
    next: 9230,
    nest: 9229,
  }
};
```

## Implementation Improvements

### 1. **Enhanced Process Source**

```javascript
// Improve the 'process' source to handle more cases
async function streamProcessLog(target: string, filters: any, follow: boolean) {
  // Option 1: Process ID
  if (/^\d+$/.test(target)) {
    return attachToProcessById(parseInt(target));
  }
  
  // Option 2: Process name
  const processes = await findProcessesByName(target);
  if (processes.length === 1) {
    return attachToProcessById(processes[0].pid);
  }
  
  // Option 3: Port number (e.g., "3000" finds process on that port)
  if (/^\d{4,5}$/.test(target)) {
    const pid = await findProcessByPort(parseInt(target));
    if (pid) return attachToProcessById(pid);
  }
  
  // Option 4: Start new process
  return startAndMonitorProcess(target);
}
```

### 2. **Better User Guidance**

```javascript
// Provide helpful error messages
class DebuggerError extends Error {
  constructor(message: string, public suggestions: string[]) {
    super(message);
  }
}

throw new DebuggerError(
  "Cannot capture output from running process",
  [
    "Restart your server with: node --inspect server.js 2>&1 | tee server.log",
    "Or use: npx browser-connect-mcp start 'node server.js'",
    "View existing logs at: logs/app.log"
  ]
);
```

### 3. **Integrated Debugging Experience**

```javascript
// New tool: backend_debug_session
export async function backendDebugSession(args: {
  action: 'start' | 'diagnose' | 'monitor';
  target?: string;
}) {
  switch (args.action) {
    case 'start':
      // Guide user through starting their backend properly
      return startDebugWizard();
      
    case 'diagnose':
      // Check current setup and provide recommendations
      return diagnoseSetup();
      
    case 'monitor':
      // Set up comprehensive monitoring
      return setupMonitoring();
  }
}
```

## Best Practices Summary

1. **Make it work with zero configuration** - Auto-detect as much as possible
2. **Provide clear guidance** - When manual steps are needed, explain them clearly
3. **Support common workflows** - npm start, node app.js, Docker, PM2, etc.
4. **Fail gracefully** - Always provide alternatives when something doesn't work
5. **Framework awareness** - Detect and support popular frameworks
6. **Progressive enhancement** - Basic features work immediately, advanced features with setup

## Example User Flows

### Flow 1: New User
```
User: "Debug my backend"
AI: "I'll help you debug your backend. I found a Node.js project. Let me start your server with debugging enabled."
[Automatically runs: node --inspect server.js with output capture]
AI: "Your server is running with debugging enabled on port 3001. I'm monitoring all logs and errors."
```

### Flow 2: Existing Process
```
User: "Debug my running server on port 3000"
AI: "I found your server running on port 3000. To enable full debugging, I need to restart it. 
     Would you like me to:
     1. Restart with debugging enabled (recommended)
     2. View existing log files
     3. Monitor system resources"
```

### Flow 3: Docker User
```
User: "Debug my Docker container"
AI: "I found container 'my-app' running. I'll stream its logs for you."
[Automatically runs: docker logs -f my-app with parsing]
```

## Future Enhancements

1. **APM Integration** - Connect to DataDog, New Relic, etc.
2. **Distributed Tracing** - Support for OpenTelemetry
3. **Log Aggregation** - Support for ELK stack, Splunk
4. **Cloud Platform Support** - AWS CloudWatch, Google Cloud Logging
5. **Kubernetes Support** - Pod logs, container debugging
6. **Performance Profiling** - CPU/Memory profiling integration
7. **Database Query Logging** - Capture and analyze slow queries
8. **Error Tracking** - Integration with Sentry, Rollbar