export interface DebugPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required?: boolean;
    default?: any;
  }[];
  template: string;
}

export const debuggingPrompts: DebugPrompt[] = [
  {
    name: 'find_javascript_errors',
    description: 'Find and analyze JavaScript errors in the console',
    template: `
To find JavaScript errors:
1. Use console_search with level: ["error"]
2. Look for patterns like TypeError, ReferenceError, SyntaxError
3. Check stack traces for error origins
4. Correlate errors happening within 5 seconds
    `
  },
  {
    name: 'debug_failed_api_calls',
    description: 'Debug failed API calls and network errors',
    arguments: [
      {
        name: 'api_pattern',
        description: 'URL pattern for API endpoints (e.g., "/api/")',
        default: '/api/'
      }
    ],
    template: `
To debug failed API calls:
1. Use network_analyze with:
   - urlPattern: "{{api_pattern}}"
   - statusRange: { min: 400, max: 599 }
2. Check console for corresponding error messages
3. Examine request/response headers
4. Look for CORS issues or authentication problems
    `
  },
  {
    name: 'analyze_slow_page_load',
    description: 'Analyze slow page load performance',
    template: `
To analyze slow page load:
1. Use performance_profile to get overall metrics
2. Identify resources taking > 1 second with network_analyze
3. Check for:
   - Large uncompressed files
   - Blocking scripts/stylesheets
   - Too many HTTP requests
   - Missing browser caching
4. Look for render-blocking resources in critical path
    `
  },
  {
    name: 'debug_memory_leaks',
    description: 'Detect potential memory leaks from console patterns',
    template: `
To detect memory leaks:
1. Use console_advanced_search with patterns:
   - "out of memory"
   - "maximum call stack"
   - "detached DOM"
2. Look for:
   - Repeated error patterns
   - Growing array/object sizes in logs
   - Uncleared intervals/timeouts
3. Correlate with network requests that repeat frequently
    `
  },
  {
    name: 'security_audit',
    description: 'Basic security audit of console and network',
    template: `
To perform security audit:
1. Search console for sensitive data exposure:
   - Patterns: ["password", "token", "api_key", "secret"]
2. Check network requests for:
   - Unencrypted HTTP requests with sensitive data
   - Missing security headers (use network_analyze)
   - CORS misconfigurations
3. Look for XSS indicators in console errors
4. Check for exposed stack traces with sensitive paths
    `
  },
  {
    name: 'debug_cors_issues',
    description: 'Debug Cross-Origin Resource Sharing (CORS) issues',
    template: `
To debug CORS issues:
1. Search console for CORS errors:
   - Pattern: "CORS|Cross-Origin|blocked by CORS policy"
2. Check network requests:
   - Look for OPTIONS preflight requests
   - Examine Access-Control headers
3. Identify:
   - Missing CORS headers
   - Credential issues
   - Wildcard origin problems
    `
  },
  {
    name: 'analyze_render_performance',
    description: 'Analyze rendering and paint performance issues',
    template: `
To analyze render performance:
1. Search console for:
   - "forced reflow"
   - "layout thrashing"
   - "repaint"
2. Use performance_profile to find:
   - Large images without dimensions
   - Excessive DOM manipulation
   - CSS animation issues
3. Look for JavaScript errors during animations
    `
  },
  {
    name: 'debug_websocket_issues',
    description: 'Debug WebSocket connection problems',
    template: `
To debug WebSocket issues:
1. Search network for WebSocket connections:
   - urlPattern: "ws://|wss://"
2. Check console for:
   - "WebSocket connection failed"
   - "WebSocket is already in CLOSING or CLOSED state"
3. Examine:
   - Connection timeouts
   - Protocol mismatches
   - Authentication failures
    `
  }
];

export function getPrompt(name: string): DebugPrompt | undefined {
  return debuggingPrompts.find(p => p.name === name);
}

export function renderPrompt(prompt: DebugPrompt, args?: Record<string, any>): string {
  let rendered = prompt.template;
  
  if (args && prompt.arguments) {
    for (const arg of prompt.arguments) {
      const value = args[arg.name] || arg.default || '';
      rendered = rendered.replace(new RegExp(`{{${arg.name}}}`, 'g'), value);
    }
  }
  
  return rendered.trim();
}