# Backend Debugging Example

This example demonstrates how to use browser-connect-mcp to debug both frontend and backend applications simultaneously.

## Setup

1. Start the backend server with debugging enabled:
   ```bash
   # Regular mode
   node server.js
   
   # With Node.js debugging enabled (recommended)
   node --inspect=9229 server.js
   ```

2. In another terminal, serve the frontend:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

3. Open the frontend in Chrome with debugging:
   ```bash
   # Launch Chrome with debugging port
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 http://localhost:8000
   ```

## Using browser-connect-mcp for Debugging

### Frontend Debugging

1. Connect to the browser tab:
   ```
   Use browser_list_tabs to see available tabs
   Use browser_connect with the tab ID
   ```

2. Monitor console and network:
   ```
   Use console_search to find specific logs
   Use network_analyze to inspect API calls
   Use error_correlate to link frontend errors with backend failures
   ```

### Backend Debugging

1. Stream backend logs:
   ```
   Use backend_logs_stream with:
   - source: "file"
   - target: "server.log"
   - filters: { level: ["error", "warn"] }
   ```

2. Attach to Node.js debugger:
   ```
   Use backend_debugger_attach with:
   - port: 9229
   - type: "node"
   ```

## Test Scenarios

1. **Normal Operation**: Click "Fetch Users" to see successful API calls
2. **Error Handling**: Click "Fetch Non-existent User" or "Trigger Backend Error"
3. **Performance Issues**: Click "Slow Request" to test slow endpoints
4. **Health Monitoring**: Click "Health Check" to verify backend status
5. **Console Logging**: Click "Generate Console Logs" to create various log levels

## What to Look For

- **Console Messages**: Both frontend console logs and backend file logs
- **Network Traffic**: API requests, response times, status codes
- **Error Correlation**: How frontend errors relate to backend issues
- **Performance Metrics**: Response times, slow endpoints
- **Security Issues**: Any exposed sensitive data or insecure requests