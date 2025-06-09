import { NetworkRequest, NetworkResponse } from '../types';

export interface PerformanceMetrics {
  navigation: {
    domContentLoaded?: number;
    loadComplete?: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  resources: {
    total: number;
    byType: Record<string, ResourceMetrics>;
    critical: CriticalResource[];
    waterfall: WaterfallEntry[];
  };
  timing: {
    totalDuration: number;
    networkTime: number;
    renderTime: number;
    jsExecutionTime?: number;
  };
  bottlenecks: PerformanceBottleneck[];
  recommendations: string[];
}

interface ResourceMetrics {
  count: number;
  totalSize: number;
  totalDuration: number;
  avgDuration: number;
  cached: number;
  failed: number;
}

interface CriticalResource {
  url: string;
  type: string;
  duration: number;
  size: number;
  priority: 'high' | 'medium' | 'low';
  blockingTime?: number;
}

interface WaterfallEntry {
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: string;
  status: number;
  parallelRequests: number;
}

interface PerformanceBottleneck {
  type: 'slow-resource' | 'blocking-resource' | 'failed-resource' | 'large-resource' | 'redirect-chain';
  description: string;
  impact: 'high' | 'medium' | 'low';
  resources: string[];
  suggestions: string[];
}

export class PerformanceProfiler {
  analyzePerformance(
    requests: NetworkRequest[],
    responses: NetworkResponse[],
    pageMetrics?: any
  ): PerformanceMetrics {
    const responseMap = new Map(responses.map(r => [r.requestId, r]));
    
    // Calculate resource metrics
    const resourceMetrics = this.calculateResourceMetrics(requests, responseMap);
    
    // Generate waterfall
    const waterfall = this.generateWaterfall(requests, responseMap);
    
    // Find critical resources
    const critical = this.identifyCriticalResources(requests, responseMap);
    
    // Detect bottlenecks
    const bottlenecks = this.detectBottlenecks(requests, responseMap, waterfall);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(resourceMetrics, bottlenecks);
    
    // Calculate timing
    const timing = this.calculateTiming(requests, responseMap);
    
    return {
      navigation: {
        domContentLoaded: pageMetrics?.domContentLoaded,
        loadComplete: pageMetrics?.loadComplete,
        firstPaint: pageMetrics?.firstPaint,
        firstContentfulPaint: pageMetrics?.firstContentfulPaint,
        largestContentfulPaint: pageMetrics?.largestContentfulPaint,
      },
      resources: {
        total: requests.length,
        byType: resourceMetrics,
        critical,
        waterfall: waterfall.slice(0, 50) // Limit waterfall entries
      },
      timing,
      bottlenecks,
      recommendations
    };
  }
  
  private calculateResourceMetrics(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): Record<string, ResourceMetrics> {
    const metrics: Record<string, ResourceMetrics> = {};
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      const type = request.resourceType || 'Other';
      
      if (!metrics[type]) {
        metrics[type] = {
          count: 0,
          totalSize: 0,
          totalDuration: 0,
          avgDuration: 0,
          cached: 0,
          failed: 0
        };
      }
      
      metrics[type].count++;
      
      if (response) {
        metrics[type].totalSize += response.encodedDataLength || 0;
        metrics[type].totalDuration += response.responseTime || 0;
        
        if (response.status >= 400) {
          metrics[type].failed++;
        }
        
        // Check if cached (status 304 or from cache headers)
        if (response.status === 304 || response.headers['x-cache'] === 'HIT') {
          metrics[type].cached++;
        }
      }
    }
    
    // Calculate averages
    for (const type in metrics) {
      if (metrics[type].count > 0) {
        metrics[type].avgDuration = metrics[type].totalDuration / metrics[type].count;
      }
    }
    
    return metrics;
  }
  
  private generateWaterfall(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): WaterfallEntry[] {
    const entries: WaterfallEntry[] = [];
    const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const request of sorted) {
      const response = responseMap.get(request.requestId);
      if (!response) continue;
      
      const startTime = request.timestamp;
      const endTime = response.timestamp;
      const duration = response.responseTime || 0;
      
      // Count parallel requests
      const parallelRequests = sorted.filter(r => {
        const rResponse = responseMap.get(r.requestId);
        if (!rResponse) return false;
        
        const rStart = r.timestamp;
        const rEnd = rResponse.timestamp;
        
        // Check if overlapping
        return (rStart <= startTime && rEnd >= startTime) ||
               (rStart >= startTime && rStart <= endTime);
      }).length - 1; // Exclude self
      
      entries.push({
        url: request.url,
        startTime,
        endTime,
        duration,
        type: request.resourceType || 'Other',
        status: response.status,
        parallelRequests
      });
    }
    
    return entries;
  }
  
  private identifyCriticalResources(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): CriticalResource[] {
    const critical: CriticalResource[] = [];
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      if (!response) continue;
      
      let priority: 'high' | 'medium' | 'low' = 'low';
      let blockingTime = 0;
      
      // Determine criticality based on resource type and characteristics
      if (request.resourceType === 'Document' || request.resourceType === 'Stylesheet') {
        priority = 'high';
        blockingTime = response.responseTime || 0;
      } else if (request.resourceType === 'Script' && !request.url.includes('async')) {
        priority = 'high';
        blockingTime = response.responseTime || 0;
      } else if (request.resourceType === 'Font') {
        priority = 'medium';
      }
      
      // Also consider slow resources as critical
      if (response.responseTime && response.responseTime > 1000) {
        priority = priority === 'low' ? 'medium' : priority;
      }
      
      if (priority !== 'low') {
        critical.push({
          url: request.url,
          type: request.resourceType || 'Other',
          duration: response.responseTime || 0,
          size: response.encodedDataLength || 0,
          priority,
          blockingTime
        });
      }
    }
    
    // Sort by priority and duration
    return critical.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.duration - a.duration;
    });
  }
  
  private detectBottlenecks(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>,
    waterfall: WaterfallEntry[]
  ): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    // Slow resources (> 2 seconds)
    const slowResources = waterfall.filter(w => w.duration > 2000);
    if (slowResources.length > 0) {
      bottlenecks.push({
        type: 'slow-resource',
        description: `${slowResources.length} resources took more than 2 seconds to load`,
        impact: 'high',
        resources: slowResources.slice(0, 5).map(r => r.url),
        suggestions: [
          'Consider using a CDN for static assets',
          'Optimize server response time',
          'Enable compression for large resources'
        ]
      });
    }
    
    // Failed resources
    const failedResources = waterfall.filter(w => w.status >= 400);
    if (failedResources.length > 0) {
      bottlenecks.push({
        type: 'failed-resource',
        description: `${failedResources.length} resources failed to load`,
        impact: 'high',
        resources: failedResources.slice(0, 5).map(r => r.url),
        suggestions: [
          'Fix broken resource URLs',
          'Check server availability',
          'Implement proper error handling'
        ]
      });
    }
    
    // Large resources (> 1MB)
    const largeResources = requests.filter(r => {
      const response = responseMap.get(r.requestId);
      return response && response.encodedDataLength && response.encodedDataLength > 1024 * 1024;
    });
    
    if (largeResources.length > 0) {
      bottlenecks.push({
        type: 'large-resource',
        description: `${largeResources.length} resources are larger than 1MB`,
        impact: 'medium',
        resources: largeResources.slice(0, 5).map(r => r.url),
        suggestions: [
          'Optimize images (use WebP, AVIF formats)',
          'Minify JavaScript and CSS files',
          'Consider lazy loading for large resources'
        ]
      });
    }
    
    // Blocking resources in critical path
    const blockingResources = waterfall
      .filter(w => w.type === 'Script' || w.type === 'Stylesheet')
      .filter(w => w.parallelRequests < 2 && w.duration > 500);
    
    if (blockingResources.length > 0) {
      bottlenecks.push({
        type: 'blocking-resource',
        description: `${blockingResources.length} resources are blocking page rendering`,
        impact: 'high',
        resources: blockingResources.slice(0, 5).map(r => r.url),
        suggestions: [
          'Load scripts asynchronously with async or defer',
          'Inline critical CSS',
          'Use resource hints (preload, prefetch)'
        ]
      });
    }
    
    return bottlenecks;
  }
  
  private calculateTiming(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): PerformanceMetrics['timing'] {
    if (requests.length === 0) {
      return {
        totalDuration: 0,
        networkTime: 0,
        renderTime: 0
      };
    }
    
    const startTime = Math.min(...requests.map(r => r.timestamp));
    let endTime = startTime;
    let totalNetworkTime = 0;
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      if (response) {
        endTime = Math.max(endTime, response.timestamp);
        totalNetworkTime += response.responseTime || 0;
      }
    }
    
    return {
      totalDuration: endTime - startTime,
      networkTime: totalNetworkTime,
      renderTime: Math.max(0, (endTime - startTime) - totalNetworkTime)
    };
  }
  
  private generateRecommendations(
    resourceMetrics: Record<string, ResourceMetrics>,
    bottlenecks: PerformanceBottleneck[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for too many requests
    const totalRequests = Object.values(resourceMetrics).reduce((sum, m) => sum + m.count, 0);
    if (totalRequests > 100) {
      recommendations.push(`Reduce the number of HTTP requests (currently ${totalRequests}). Consider bundling resources.`);
    }
    
    // Check for low cache hit rate
    const totalCached = Object.values(resourceMetrics).reduce((sum, m) => sum + m.cached, 0);
    const cacheRate = totalRequests > 0 ? totalCached / totalRequests : 0;
    if (cacheRate < 0.3) {
      recommendations.push('Improve caching strategy. Only ' + Math.round(cacheRate * 100) + '% of resources are cached.');
    }
    
    // Check for too many images
    if (resourceMetrics.Image && resourceMetrics.Image.count > 50) {
      recommendations.push('Consider implementing lazy loading for images. Found ' + resourceMetrics.Image.count + ' images.');
    }
    
    // Check for uncompressed resources
    if (resourceMetrics.Script && resourceMetrics.Script.totalSize > 500 * 1024) {
      recommendations.push('Enable compression for JavaScript files. Total size: ' + Math.round(resourceMetrics.Script.totalSize / 1024) + 'KB');
    }
    
    // Add specific recommendations based on bottlenecks
    const highImpactBottlenecks = bottlenecks.filter(b => b.impact === 'high');
    if (highImpactBottlenecks.length > 0) {
      recommendations.push('Address high-impact performance issues first:');
      highImpactBottlenecks.forEach(b => {
        recommendations.push(`- ${b.description}`);
      });
    }
    
    return recommendations;
  }
}