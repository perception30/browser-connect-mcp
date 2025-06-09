import { ConsoleMessage, NetworkRequest, NetworkResponse } from '../types';

export interface LogInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'suggestion';
  category: 'performance' | 'error' | 'security' | 'usage' | 'debugging';
  title: string;
  description: string;
  confidence: number; // 0-1
  evidence: {
    messages?: ConsoleMessage[];
    requests?: NetworkRequest[];
    metrics?: Record<string, any>;
  };
  recommendations?: string[];
  impact?: 'high' | 'medium' | 'low';
}

export class IntelligentLogAnalyzer {
  analyzeLogsIntelligently(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responses: NetworkResponse[]
  ): LogInsight[] {
    const insights: LogInsight[] = [];
    const responseMap = new Map(responses.map(r => [r.requestId, r]));
    
    // 1. Detect patterns in logs
    insights.push(...this.detectLogPatterns(messages));
    
    // 2. Find anomalies
    insights.push(...this.detectAnomalies(messages, requests, responseMap));
    
    // 3. Analyze trends
    insights.push(...this.analyzeTrends(messages, requests, responseMap));
    
    // 4. Generate smart suggestions
    insights.push(...this.generateSuggestions(messages, requests, responseMap));
    
    // Sort by confidence and impact
    return insights.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      if (a.impact && b.impact && a.impact !== b.impact) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return b.confidence - a.confidence;
    });
  }
  
  private detectLogPatterns(messages: ConsoleMessage[]): LogInsight[] {
    const insights: LogInsight[] = [];
    
    // Pattern: Excessive logging
    const messageFrequency = this.calculateMessageFrequency(messages);
    if (messageFrequency > 10) { // More than 10 messages per second
      insights.push({
        id: 'pattern-excessive-logging',
        type: 'pattern',
        category: 'performance',
        title: 'Excessive console logging detected',
        description: `Console is receiving ${messageFrequency.toFixed(1)} messages per second, which may impact performance`,
        confidence: Math.min(messageFrequency / 20, 1),
        evidence: {
          metrics: {
            messagesPerSecond: messageFrequency,
            totalMessages: messages.length,
          }
        },
        recommendations: [
          'Reduce console logging in production',
          'Use conditional logging based on environment',
          'Consider using a proper logging library with levels',
        ],
        impact: messageFrequency > 50 ? 'high' : 'medium',
      });
    }
    
    // Pattern: Memory leak indicators
    const memoryPatterns = messages.filter(m => 
      /memory|heap|allocation|garbage collection/i.test(m.text)
    );
    
    if (memoryPatterns.length > 5) {
      insights.push({
        id: 'pattern-memory-issues',
        type: 'pattern',
        category: 'performance',
        title: 'Potential memory issues detected',
        description: 'Multiple console messages related to memory management found',
        confidence: Math.min(memoryPatterns.length / 10, 1),
        evidence: {
          messages: memoryPatterns.slice(0, 5),
          metrics: {
            memoryRelatedMessages: memoryPatterns.length,
          }
        },
        recommendations: [
          'Profile memory usage in DevTools',
          'Check for detached DOM nodes',
          'Review event listener cleanup',
          'Look for circular references',
        ],
        impact: 'high',
      });
    }
    
    // Pattern: Development artifacts in production
    const devPatterns = messages.filter(m => 
      /console\.log|TODO|FIXME|DEBUG|localhost|test/i.test(m.text)
    );
    
    if (devPatterns.length > 10) {
      insights.push({
        id: 'pattern-dev-artifacts',
        type: 'pattern',
        category: 'debugging',
        title: 'Development artifacts detected',
        description: 'Console contains development-related messages that should be removed in production',
        confidence: 0.8,
        evidence: {
          messages: devPatterns.slice(0, 5),
          metrics: {
            devMessages: devPatterns.length,
          }
        },
        recommendations: [
          'Remove console.log statements before production',
          'Use environment-based logging',
          'Configure build tools to strip debug code',
        ],
        impact: 'low',
      });
    }
    
    return insights;
  }
  
  private detectAnomalies(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): LogInsight[] {
    const insights: LogInsight[] = [];
    
    // Anomaly: Sudden spike in errors
    const errorTimeline = this.createErrorTimeline(messages);
    const spikes = this.detectSpikes(errorTimeline);
    
    for (const spike of spikes) {
      insights.push({
        id: `anomaly-error-spike-${spike.timestamp}`,
        type: 'anomaly',
        category: 'error',
        title: 'Sudden spike in errors detected',
        description: `Error rate increased ${spike.magnitude}x at ${new Date(spike.timestamp).toISOString()}`,
        confidence: Math.min(spike.magnitude / 5, 1),
        evidence: {
          messages: spike.errors,
          metrics: {
            normalRate: spike.normalRate,
            spikeRate: spike.spikeRate,
            magnitude: spike.magnitude,
          }
        },
        recommendations: [
          'Investigate what changed at this time',
          'Check for failed deployments or API changes',
          'Review error messages for common patterns',
        ],
        impact: spike.magnitude > 10 ? 'high' : 'medium',
      });
    }
    
    // Anomaly: Unusual network patterns
    const requestPatterns = this.analyzeRequestPatterns(requests, responseMap);
    
    if (requestPatterns.hasUnusualTraffic) {
      insights.push({
        id: 'anomaly-network-pattern',
        type: 'anomaly',
        category: 'performance',
        title: 'Unusual network traffic pattern detected',
        description: requestPatterns.description,
        confidence: requestPatterns.confidence,
        evidence: {
          metrics: requestPatterns.metrics,
        },
        recommendations: [
          'Check for polling intervals that are too frequent',
          'Look for duplicate or redundant requests',
          'Verify API endpoint health',
        ],
        impact: 'medium',
      });
    }
    
    return insights;
  }
  
  private analyzeTrends(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): LogInsight[] {
    const insights: LogInsight[] = [];
    
    // Trend: Increasing response times
    const responseTrend = this.analyzeResponseTimeTrend(requests, responseMap);
    
    if (responseTrend.isIncreasing) {
      insights.push({
        id: 'trend-response-time',
        type: 'trend',
        category: 'performance',
        title: 'Response times are increasing',
        description: `Average response time increased from ${responseTrend.startAvg}ms to ${responseTrend.endAvg}ms`,
        confidence: responseTrend.confidence,
        evidence: {
          metrics: {
            startAverage: responseTrend.startAvg,
            endAverage: responseTrend.endAvg,
            percentIncrease: responseTrend.percentIncrease,
          }
        },
        recommendations: [
          'Monitor server performance metrics',
          'Check for increased load or traffic',
          'Review recent code changes for performance issues',
          'Consider implementing caching',
        ],
        impact: responseTrend.percentIncrease > 50 ? 'high' : 'medium',
      });
    }
    
    // Trend: Error rate changes
    const errorTrend = this.analyzeErrorTrend(messages);
    
    if (errorTrend.isSignificant) {
      insights.push({
        id: 'trend-error-rate',
        type: 'trend',
        category: 'error',
        title: errorTrend.isIncreasing ? 'Error rate is increasing' : 'Error rate is decreasing',
        description: `Error rate changed by ${Math.abs(errorTrend.percentChange)}% over the session`,
        confidence: errorTrend.confidence,
        evidence: {
          metrics: {
            startRate: errorTrend.startRate,
            endRate: errorTrend.endRate,
            percentChange: errorTrend.percentChange,
          }
        },
        recommendations: errorTrend.isIncreasing ? [
          'Investigate recent deployments',
          'Check for external service issues',
          'Review error handling code',
        ] : [
          'Document what fixed the issues',
          'Add tests to prevent regression',
        ],
        impact: Math.abs(errorTrend.percentChange) > 50 ? 'high' : 'medium',
      });
    }
    
    return insights;
  }
  
  private generateSuggestions(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): LogInsight[] {
    const insights: LogInsight[] = [];
    
    // Suggestion: API consolidation
    const apiAnalysis = this.analyzeAPICalls(requests, responseMap);
    
    if (apiAnalysis.hasDuplicates) {
      insights.push({
        id: 'suggestion-api-consolidation',
        type: 'suggestion',
        category: 'performance',
        title: 'API calls can be consolidated',
        description: 'Multiple similar API calls detected that could be batched or cached',
        confidence: 0.9,
        evidence: {
          metrics: {
            duplicateRequests: apiAnalysis.duplicates,
            potentialSavings: `${apiAnalysis.potentialSavings}ms`,
          }
        },
        recommendations: [
          'Implement request batching for similar endpoints',
          'Use caching for frequently requested data',
          'Consider GraphQL or similar to reduce requests',
        ],
        impact: 'medium',
      });
    }
    
    // Suggestion: Error handling improvements
    const unhandledErrors = messages.filter(m => 
      m.level === 'error' && /uncaught|unhandled/i.test(m.text)
    );
    
    if (unhandledErrors.length > 0) {
      insights.push({
        id: 'suggestion-error-handling',
        type: 'suggestion',
        category: 'error',
        title: 'Improve error handling',
        description: `Found ${unhandledErrors.length} unhandled errors that need proper error boundaries`,
        confidence: 1,
        evidence: {
          messages: unhandledErrors.slice(0, 3),
        },
        recommendations: [
          'Add try-catch blocks around async operations',
          'Implement error boundaries in React components',
          'Add global error handlers for uncaught exceptions',
          'Log errors to monitoring service',
        ],
        impact: 'high',
      });
    }
    
    // Suggestion: Performance optimizations
    const performanceIssues = this.identifyPerformanceIssues(messages, requests, responseMap);
    
    if (performanceIssues.length > 0) {
      insights.push({
        id: 'suggestion-performance',
        type: 'suggestion',
        category: 'performance',
        title: 'Performance optimization opportunities',
        description: 'Several performance improvements can be made',
        confidence: 0.8,
        evidence: {
          metrics: {
            issues: performanceIssues,
          }
        },
        recommendations: performanceIssues.map(issue => issue.recommendation),
        impact: 'medium',
      });
    }
    
    return insights;
  }
  
  // Helper methods
  
  private calculateMessageFrequency(messages: ConsoleMessage[]): number {
    if (messages.length < 2) return 0;
    
    const timeSpan = messages[messages.length - 1].timestamp - messages[0].timestamp;
    if (timeSpan === 0) return messages.length;
    
    return (messages.length / timeSpan) * 1000; // messages per second
  }
  
  private createErrorTimeline(messages: ConsoleMessage[]): { timestamp: number; count: number }[] {
    const errors = messages.filter(m => m.level === 'error');
    const buckets = new Map<number, number>();
    const bucketSize = 60000; // 1 minute buckets
    
    for (const error of errors) {
      const bucket = Math.floor(error.timestamp / bucketSize) * bucketSize;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    }
    
    return Array.from(buckets.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  private detectSpikes(timeline: { timestamp: number; count: number }[]): any[] {
    const spikes = [];
    const window = 3; // Look at 3 buckets at a time
    
    for (let i = window; i < timeline.length; i++) {
      const previous = timeline.slice(i - window, i);
      const current = timeline[i];
      
      const avgPrevious = previous.reduce((sum, p) => sum + p.count, 0) / window;
      const magnitude = current.count / (avgPrevious || 1);
      
      if (magnitude > 3) { // 3x increase is a spike
        spikes.push({
          timestamp: current.timestamp,
          normalRate: avgPrevious,
          spikeRate: current.count,
          magnitude,
          errors: [], // Would need to filter actual messages
        });
      }
    }
    
    return spikes;
  }
  
  private analyzeRequestPatterns(
    requests: NetworkRequest[],
    _responseMap: Map<string, NetworkResponse>
  ): any {
    // Group requests by endpoint
    const endpoints = new Map<string, NetworkRequest[]>();
    
    for (const request of requests) {
      const url = new URL(request.url);
      const endpoint = `${url.pathname}`;
      
      if (!endpoints.has(endpoint)) {
        endpoints.set(endpoint, []);
      }
      endpoints.get(endpoint)!.push(request);
    }
    
    // Look for unusual patterns
    let hasUnusualTraffic = false;
    let description = '';
    const metrics: any = {};
    
    for (const [endpoint, reqs] of endpoints) {
      if (reqs.length > 50) {
        hasUnusualTraffic = true;
        description = `Endpoint ${endpoint} called ${reqs.length} times`;
        metrics.hotEndpoint = endpoint;
        metrics.callCount = reqs.length;
        
        // Check request frequency
        const timeSpan = reqs[reqs.length - 1].timestamp - reqs[0].timestamp;
        const frequency = (reqs.length / timeSpan) * 1000;
        
        if (frequency > 1) { // More than 1 request per second
          metrics.requestsPerSecond = frequency;
          description += ` at ${frequency.toFixed(1)} requests/second`;
        }
      }
    }
    
    return {
      hasUnusualTraffic,
      description,
      confidence: hasUnusualTraffic ? 0.8 : 0,
      metrics,
    };
  }
  
  private analyzeResponseTimeTrend(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): any {
    const timeSeries: { timestamp: number; responseTime: number }[] = [];
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      if (response && response.responseTime) {
        timeSeries.push({
          timestamp: request.timestamp,
          responseTime: response.responseTime,
        });
      }
    }
    
    if (timeSeries.length < 10) {
      return { isIncreasing: false };
    }
    
    // Compare first third with last third
    const third = Math.floor(timeSeries.length / 3);
    const firstThird = timeSeries.slice(0, third);
    const lastThird = timeSeries.slice(-third);
    
    const avgFirst = firstThird.reduce((sum, t) => sum + t.responseTime, 0) / firstThird.length;
    const avgLast = lastThird.reduce((sum, t) => sum + t.responseTime, 0) / lastThird.length;
    
    const percentIncrease = ((avgLast - avgFirst) / avgFirst) * 100;
    
    return {
      isIncreasing: percentIncrease > 20,
      startAvg: Math.round(avgFirst),
      endAvg: Math.round(avgLast),
      percentIncrease: Math.round(percentIncrease),
      confidence: Math.min(Math.abs(percentIncrease) / 50, 1),
    };
  }
  
  private analyzeErrorTrend(messages: ConsoleMessage[]): any {
    const errors = messages.filter(m => m.level === 'error');
    const total = messages.length;
    
    if (errors.length < 5 || total < 50) {
      return { isSignificant: false };
    }
    
    // Split into first half and second half
    const midpoint = Math.floor(total / 2);
    const firstHalf = messages.slice(0, midpoint);
    const secondHalf = messages.slice(midpoint);
    
    const errorsFirst = firstHalf.filter(m => m.level === 'error').length;
    const errorsSecond = secondHalf.filter(m => m.level === 'error').length;
    
    const rateFirst = errorsFirst / firstHalf.length;
    const rateSecond = errorsSecond / secondHalf.length;
    
    const percentChange = ((rateSecond - rateFirst) / rateFirst) * 100;
    
    return {
      isSignificant: Math.abs(percentChange) > 30,
      isIncreasing: percentChange > 0,
      startRate: Math.round(rateFirst * 100),
      endRate: Math.round(rateSecond * 100),
      percentChange: Math.round(percentChange),
      confidence: Math.min(Math.abs(percentChange) / 50, 1),
    };
  }
  
  private analyzeAPICalls(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): any {
    const apiCalls = requests.filter(r => r.url.includes('/api/'));
    const duplicates = new Map<string, number>();
    
    // Find duplicate calls
    for (const request of apiCalls) {
      const key = `${request.method} ${request.url}`;
      duplicates.set(key, (duplicates.get(key) || 0) + 1);
    }
    
    const duplicateCount = Array.from(duplicates.values()).filter(c => c > 1).length;
    const totalDuplicates = Array.from(duplicates.values()).reduce((sum, c) => sum + Math.max(0, c - 1), 0);
    
    // Calculate potential time savings
    let potentialSavings = 0;
    for (const [key, count] of duplicates) {
      if (count > 1) {
        const matchingRequests = apiCalls.filter(r => `${r.method} ${r.url}` === key);
        for (const req of matchingRequests) {
          const response = responseMap.get(req.requestId);
          if (response && response.responseTime) {
            potentialSavings += response.responseTime * (count - 1) / count;
          }
        }
      }
    }
    
    return {
      hasDuplicates: duplicateCount > 0,
      duplicates: totalDuplicates,
      potentialSavings: Math.round(potentialSavings),
    };
  }
  
  private identifyPerformanceIssues(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): any[] {
    const issues = [];
    
    // Check for large payloads
    const largeResponses = Array.from(responseMap.values()).filter(r => 
      r.encodedDataLength && r.encodedDataLength > 1024 * 1024 // 1MB
    );
    
    if (largeResponses.length > 0) {
      issues.push({
        type: 'large-payload',
        count: largeResponses.length,
        recommendation: 'Implement pagination or lazy loading for large data sets',
      });
    }
    
    // Check for render performance warnings
    const renderWarnings = messages.filter(m => 
      /forced reflow|layout thrashing|recalculate style/i.test(m.text)
    );
    
    if (renderWarnings.length > 0) {
      issues.push({
        type: 'render-performance',
        count: renderWarnings.length,
        recommendation: 'Batch DOM updates and avoid layout thrashing',
      });
    }
    
    return issues;
  }
}