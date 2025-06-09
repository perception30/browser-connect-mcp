import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './utils/browser-manager';
import { searchConsoleMessages, searchNetworkRequests, analyzeNetworkPerformance } from './utils/search-utils';
import { exportToHAR } from './utils/har-export';
import { AdvancedMatcher, correlateMessages, calculateSearchStats } from './utils/advanced-search';
import { PerformanceProfiler } from './utils/performance-profiler';
import { debuggingPrompts, getPrompt, renderPrompt } from './prompts/debugging-prompts';
import { ErrorCorrelator } from './utils/error-correlation';
import { SecurityScanner } from './utils/security-scanner';
import { IntelligentLogAnalyzer } from './utils/log-analyzer';
import logger from './utils/logger';

// Initialize browser manager
const browserManager = new BrowserManager();

// Initialize MCP server
const server = new Server(
  {
    name: 'browser-connect-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Tool definitions
const tools: Tool[] = [
  {
    name: 'browser_list_tabs',
    description: 'List all available browser tabs that can be connected to',
    inputSchema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Browser debugging host (default: localhost)',
          default: 'localhost',
        },
        port: {
          type: 'number',
          description: 'Browser debugging port (default: 9222)',
          default: 9222,
        },
      },
    },
  },
  {
    name: 'browser_connect',
    description: 'Connect to a specific browser tab for debugging',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to connect to',
        },
        host: {
          type: 'string',
          description: 'Browser debugging host (default: localhost)',
          default: 'localhost',
        },
        port: {
          type: 'number',
          description: 'Browser debugging port (default: 9222)',
          default: 9222,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'browser_disconnect',
    description: 'Disconnect from a specific browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to disconnect from',
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'console_search',
    description: 'Search and filter console messages from connected browser tabs',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to search console messages from',
        },
        pattern: {
          type: 'string',
          description: 'Text pattern to search for in console messages',
        },
        regex: {
          type: 'boolean',
          description: 'Treat pattern as regular expression',
          default: false,
        },
        level: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['log', 'info', 'warn', 'error', 'debug'],
          },
          description: 'Filter by console message levels',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return',
          default: 100,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'network_analyze',
    description: 'Analyze network requests and responses from connected browser tabs',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to analyze network traffic from',
        },
        urlPattern: {
          type: 'string',
          description: 'Regular expression pattern to filter URLs',
        },
        method: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
          },
          description: 'Filter by HTTP methods',
        },
        statusCode: {
          type: 'array',
          items: {
            type: 'number',
          },
          description: 'Filter by specific status codes',
        },
        statusRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
          },
          description: 'Filter by status code range',
        },
        minDuration: {
          type: 'number',
          description: 'Minimum response time in milliseconds',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of requests to return',
          default: 100,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'network_performance',
    description: 'Get network performance statistics for a connected browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to analyze',
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'browser_launch',
    description: 'Launch a new browser instance with debugging enabled',
    inputSchema: {
      type: 'object',
      properties: {
        executablePath: {
          type: 'string',
          description: 'Path to Chrome/Chromium executable (auto-detected if not provided)',
        },
      },
    },
  },
  {
    name: 'network_export_har',
    description: 'Export network traffic to HAR (HTTP Archive) format',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to export network traffic from',
        },
        includeResponseBodies: {
          type: 'boolean',
          description: 'Include response body content in HAR (may increase file size)',
          default: false,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'console_advanced_search',
    description: 'Advanced console search with pattern matching, correlation, and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to search',
        },
        patterns: {
          type: 'object',
          description: 'Pattern matching configuration',
          properties: {
            include: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patterns to include (regex supported)',
            },
            exclude: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patterns to exclude',
            },
            mode: {
              type: 'string',
              enum: ['any', 'all'],
              description: 'Match mode: any (OR) or all (AND)',
              default: 'any',
            },
          },
        },
        namedPatterns: {
          type: 'object',
          description: 'Named regex patterns with capture groups',
          additionalProperties: { type: 'string' },
        },
        correlate: {
          type: 'object',
          description: 'Message correlation options',
          properties: {
            timeWindow: {
              type: 'number',
              description: 'Time window in milliseconds',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to group by',
            },
          },
        },
        includeStats: {
          type: 'boolean',
          description: 'Include search statistics',
          default: true,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'performance_profile',
    description: 'Advanced performance profiling with bottleneck detection and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to profile',
        },
        includeWaterfall: {
          type: 'boolean',
          description: 'Include request waterfall visualization',
          default: true,
        },
        includeRecommendations: {
          type: 'boolean',
          description: 'Include performance recommendations',
          default: true,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'error_correlate',
    description: 'Automatically correlate errors between console and network, find root causes',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to analyze',
        },
        timeWindow: {
          type: 'number',
          description: 'Time window in milliseconds for correlation (default: 5000)',
          default: 5000,
        },
        minSeverity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Minimum severity to include',
          default: 'low',
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'security_scan',
    description: 'Scan for security vulnerabilities in console and network traffic',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to scan',
        },
        includeRecommendations: {
          type: 'boolean',
          description: 'Include detailed recommendations',
          default: true,
        },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'log_analyze',
    description: 'Intelligently analyze logs to find patterns, anomalies, trends, and suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: {
          type: 'string',
          description: 'The ID of the tab to analyze',
        },
        includeAllInsights: {
          type: 'boolean',
          description: 'Include all insights regardless of confidence',
          default: false,
        },
      },
      required: ['tabId'],
    },
  },
];

// Register tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Register prompts handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: debuggingPrompts.map(p => ({
    name: p.name,
    description: p.description,
    arguments: p.arguments?.map(arg => ({
      name: arg.name,
      description: arg.description,
      required: arg.required || false,
    })),
  })),
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const prompt = getPrompt(name);
  
  if (!prompt) {
    throw new Error(`Unknown prompt: ${name}`);
  }
  
  const messages = [{
    role: 'user' as const,
    content: {
      type: 'text' as const,
      text: renderPrompt(prompt, args),
    },
  }];
  
  return { messages };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'browser_list_tabs': {
        const { host = 'localhost', port = 9222 } = args as any;
        const tabs = await browserManager.connectToBrowser(host, port);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tabs, null, 2),
            },
          ],
        };
      }

      case 'browser_connect': {
        const { tabId, host = 'localhost', port = 9222 } = args as any;
        await browserManager.connectToTab(tabId, host, port);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully connected to tab ${tabId}`,
            },
          ],
        };
      }

      case 'browser_disconnect': {
        const { tabId } = args as any;
        await browserManager.disconnectTab(tabId);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully disconnected from tab ${tabId}`,
            },
          ],
        };
      }

      case 'console_search': {
        const { tabId, pattern, regex, level, limit = 100 } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const messages = browserManager.getConsoleMessages(tabId);
        const filtered = searchConsoleMessages(messages, {
          pattern,
          regex,
          level,
          limit,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalMessages: messages.length,
                matchedMessages: filtered.length,
                messages: filtered,
              }, null, 2),
            },
          ],
        };
      }

      case 'network_analyze': {
        const { tabId, urlPattern, method, statusCode, statusRange, minDuration, limit = 100 } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        const results = searchNetworkRequests(requests, responses, {
          urlPattern,
          method,
          statusCode,
          statusRange,
          minDuration,
          limit,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalRequests: requests.length,
                matchedRequests: results.length,
                requests: results,
              }, null, 2),
            },
          ],
        };
      }

      case 'network_performance': {
        const { tabId } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        const analysis = analyzeNetworkPerformance(requests, responses);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case 'browser_launch': {
        const { executablePath } = args as any;
        await browserManager.launchBrowser(executablePath);
        return {
          content: [
            {
              type: 'text',
              text: 'Browser launched successfully with debugging enabled on port 9222',
            },
          ],
        };
      }

      case 'network_export_har': {
        const { tabId } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        
        // Get browser info if available
        const browserInfo = {
          name: 'Chrome',
          version: 'Unknown'
        };
        
        const har = exportToHAR(requests, responses, `Tab ${tabId}`, browserInfo);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(har, null, 2),
            },
          ],
        };
      }

      case 'console_advanced_search': {
        const { tabId, patterns, namedPatterns, correlate, includeStats = true } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const messages = browserManager.getConsoleMessages(tabId);
        const matcher = new AdvancedMatcher({ patterns, namedPatterns });
        
        // Perform advanced search
        const searchResults = messages
          .map(msg => matcher.matchConsoleMessage(msg))
          .filter(result => result !== null);
        
        // Correlate messages if requested
        let correlations = null;
        if (correlate && correlate.timeWindow) {
          correlations = correlateMessages(messages, correlate);
        }
        
        // Calculate statistics if requested
        let statistics = null;
        if (includeStats) {
          statistics = calculateSearchStats(searchResults);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalMessages: messages.length,
                matchedMessages: searchResults.length,
                results: searchResults.slice(0, 100), // Limit results
                correlations: correlations ? Array.from(correlations.entries()) : null,
                statistics
              }, null, 2),
            },
          ],
        };
      }

      case 'performance_profile': {
        const { tabId, includeWaterfall = true, includeRecommendations = true } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        
        const profiler = new PerformanceProfiler();
        const metrics = profiler.analyzePerformance(requests, responses);
        
        // Optionally remove waterfall or recommendations
        if (!includeWaterfall) {
          metrics.resources.waterfall = [];
        }
        if (!includeRecommendations) {
          metrics.recommendations = [];
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      }

      case 'error_correlate': {
        const { tabId, minSeverity = 'low' } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const messages = browserManager.getConsoleMessages(tabId);
        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        
        const correlator = new ErrorCorrelator();
        const correlations = correlator.correlateErrors(messages, requests, responses);
        
        // Filter by severity
        const severityOrder = { low: 0, medium: 1, high: 2 };
        const filtered = correlations.filter(c => 
          severityOrder[c.severity] >= severityOrder[minSeverity as keyof typeof severityOrder]
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalCorrelations: filtered.length,
                correlations: filtered,
                summary: {
                  high: filtered.filter(c => c.severity === 'high').length,
                  medium: filtered.filter(c => c.severity === 'medium').length,
                  low: filtered.filter(c => c.severity === 'low').length,
                }
              }, null, 2),
            },
          ],
        };
      }

      case 'security_scan': {
        const { tabId, includeRecommendations = true } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const messages = browserManager.getConsoleMessages(tabId);
        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        
        const scanner = new SecurityScanner();
        let issues = scanner.scanForVulnerabilities(messages, requests, responses);
        
        // Optionally remove recommendations
        if (!includeRecommendations) {
          issues = issues.map(issue => ({
            ...issue,
            recommendations: [],
            references: []
          }));
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalIssues: issues.length,
                summary: {
                  critical: issues.filter(i => i.severity === 'critical').length,
                  high: issues.filter(i => i.severity === 'high').length,
                  medium: issues.filter(i => i.severity === 'medium').length,
                  low: issues.filter(i => i.severity === 'low').length,
                },
                issues
              }, null, 2),
            },
          ],
        };
      }

      case 'log_analyze': {
        const { tabId, includeAllInsights = false } = args as any;
        
        if (!browserManager.isConnected(tabId)) {
          throw new Error(`Not connected to tab ${tabId}. Use browser_connect first.`);
        }

        const messages = browserManager.getConsoleMessages(tabId);
        const requests = browserManager.getNetworkRequests(tabId);
        const responses = browserManager.getNetworkResponses(tabId);
        
        const analyzer = new IntelligentLogAnalyzer();
        let insights = analyzer.analyzeLogsIntelligently(messages, requests, responses);
        
        // Filter by confidence unless including all
        if (!includeAllInsights) {
          insights = insights.filter(i => i.confidence >= 0.7);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalInsights: insights.length,
                summary: {
                  patterns: insights.filter(i => i.type === 'pattern').length,
                  anomalies: insights.filter(i => i.type === 'anomaly').length,
                  trends: insights.filter(i => i.type === 'trend').length,
                  suggestions: insights.filter(i => i.type === 'suggestion').length,
                },
                insights
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await browserManager.disconnectAll();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Browser Connect MCP server started');
}

main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});