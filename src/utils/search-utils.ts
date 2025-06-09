import { ConsoleMessage, SearchOptions, NetworkRequest, NetworkResponse, NetworkSearchOptions } from '../types';

export function searchConsoleMessages(
  messages: ConsoleMessage[],
  options: SearchOptions
): ConsoleMessage[] {
  let filtered = [...messages];

  // Filter by level
  if (options.level) {
    const levels = Array.isArray(options.level) ? options.level : [options.level];
    filtered = filtered.filter(msg => levels.includes(msg.level));
  }

  // Filter by time range
  if (options.startTime) {
    filtered = filtered.filter(msg => msg.timestamp >= options.startTime!);
  }
  if (options.endTime) {
    filtered = filtered.filter(msg => msg.timestamp <= options.endTime!);
  }

  // Filter by pattern
  if (options.pattern) {
    const searchPattern = options.regex
      ? new RegExp(options.pattern, options.caseSensitive ? '' : 'i')
      : options.pattern.toLowerCase();

    filtered = filtered.filter(msg => {
      const text = options.caseSensitive ? msg.text : msg.text.toLowerCase();
      return options.regex
        ? (searchPattern as RegExp).test(text)
        : text.includes(searchPattern as string);
    });
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(-options.limit);
  }

  return filtered;
}

export function searchNetworkRequests(
  requests: NetworkRequest[],
  responses: NetworkResponse[],
  options: NetworkSearchOptions
): { request: NetworkRequest; response?: NetworkResponse }[] {
  const responseMap = new Map(responses.map(r => [r.requestId, r]));
  let results = requests.map(request => ({
    request,
    response: responseMap.get(request.requestId),
  }));

  // Filter by URL pattern
  if (options.urlPattern) {
    const pattern = new RegExp(options.urlPattern, 'i');
    results = results.filter(({ request }) => pattern.test(request.url));
  }

  // Filter by method
  if (options.method) {
    const methods = Array.isArray(options.method) ? options.method : [options.method];
    results = results.filter(({ request }) => 
      methods.includes(request.method.toUpperCase())
    );
  }

  // Filter by status code
  if (options.statusCode) {
    const codes = Array.isArray(options.statusCode) ? options.statusCode : [options.statusCode];
    results = results.filter(({ response }) => 
      response && codes.includes(response.status)
    );
  }

  // Filter by status range
  if (options.statusRange) {
    results = results.filter(({ response }) => 
      response && 
      response.status >= options.statusRange!.min && 
      response.status <= options.statusRange!.max
    );
  }

  // Filter by resource type
  if (options.resourceType) {
    const types = Array.isArray(options.resourceType) ? options.resourceType : [options.resourceType];
    results = results.filter(({ request }) => 
      request.resourceType && types.includes(request.resourceType)
    );
  }

  // Filter by duration
  if (options.minDuration !== undefined || options.maxDuration !== undefined) {
    results = results.filter(({ response }) => {
      if (!response || response.responseTime === undefined) return false;
      
      if (options.minDuration !== undefined && response.responseTime < options.minDuration) {
        return false;
      }
      if (options.maxDuration !== undefined && response.responseTime > options.maxDuration) {
        return false;
      }
      return true;
    });
  }

  // Filter by time range
  if (options.startTime) {
    results = results.filter(({ request }) => request.timestamp >= options.startTime!);
  }
  if (options.endTime) {
    results = results.filter(({ request }) => request.timestamp <= options.endTime!);
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    results = results.slice(-options.limit);
  }

  return results;
}

export function analyzeNetworkPerformance(
  requests: NetworkRequest[],
  responses: NetworkResponse[]
): {
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestRequests: { url: string; duration: number }[];
  requestsByStatus: Record<string, number>;
  requestsByType: Record<string, number>;
} {
  const responseMap = new Map(responses.map(r => [r.requestId, r]));
  const durations: number[] = [];
  const slowRequests: { url: string; duration: number }[] = [];
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  let failedCount = 0;

  for (const request of requests) {
    const response = responseMap.get(request.requestId);
    
    // Count by type
    if (request.resourceType) {
      typeCounts[request.resourceType] = (typeCounts[request.resourceType] || 0) + 1;
    }

    if (response) {
      // Count by status
      const statusGroup = `${Math.floor(response.status / 100)}xx`;
      statusCounts[statusGroup] = (statusCounts[statusGroup] || 0) + 1;

      // Track failed requests
      if (response.status >= 400) {
        failedCount++;
      }

      // Track response times
      if (response.responseTime !== undefined) {
        durations.push(response.responseTime);
        slowRequests.push({
          url: request.url,
          duration: response.responseTime,
        });
      }
    }
  }

  // Sort by duration and keep top 10 slowest
  slowRequests.sort((a, b) => b.duration - a.duration);
  const slowestRequests = slowRequests.slice(0, 10);

  // Calculate average response time
  const averageResponseTime = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  return {
    totalRequests: requests.length,
    failedRequests: failedCount,
    averageResponseTime,
    slowestRequests,
    requestsByStatus: statusCounts,
    requestsByType: typeCounts,
  };
}