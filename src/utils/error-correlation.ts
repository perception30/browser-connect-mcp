import { ConsoleMessage, NetworkRequest, NetworkResponse } from '../types';

export interface ErrorCorrelation {
  id: string;
  type: 'console-console' | 'console-network' | 'repeated-error' | 'cascade';
  severity: 'high' | 'medium' | 'low';
  rootCause?: {
    type: string;
    message: string;
    source: string;
  };
  relatedItems: {
    consoleMessages?: ConsoleMessage[];
    networkRequests?: { request: NetworkRequest; response?: NetworkResponse }[];
  };
  summary: string;
  suggestions: string[];
  timeSpan: {
    start: number;
    end: number;
  };
}

export class ErrorCorrelator {
  private readonly TIME_WINDOW = 5000; // 5 seconds
  private readonly SIMILAR_ERROR_THRESHOLD = 0.8;
  
  correlateErrors(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responses: NetworkResponse[]
  ): ErrorCorrelation[] {
    const correlations: ErrorCorrelation[] = [];
    const responseMap = new Map(responses.map(r => [r.requestId, r]));
    
    // 1. Find console errors related to network failures
    correlations.push(...this.correlateNetworkErrors(messages, requests, responseMap));
    
    // 2. Find cascading errors
    correlations.push(...this.findCascadingErrors(messages));
    
    // 3. Find repeated errors
    correlations.push(...this.findRepeatedErrors(messages));
    
    // 4. Identify root causes
    this.identifyRootCauses(correlations);
    
    return correlations;
  }
  
  private correlateNetworkErrors(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): ErrorCorrelation[] {
    const correlations: ErrorCorrelation[] = [];
    const errorMessages = messages.filter(m => m.level === 'error');
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      if (!response || response.status < 400) continue;
      
      // Find console errors within time window
      const relatedErrors = errorMessages.filter(msg => 
        Math.abs(msg.timestamp - response.timestamp) <= this.TIME_WINDOW &&
        (msg.text.includes(request.url) || 
         msg.text.includes(String(response.status)) ||
         this.isNetworkErrorMessage(msg.text))
      );
      
      if (relatedErrors.length > 0) {
        correlations.push({
          id: `net-error-${request.requestId}`,
          type: 'console-network',
          severity: response.status >= 500 ? 'high' : 'medium',
          relatedItems: {
            consoleMessages: relatedErrors,
            networkRequests: [{ request, response }],
          },
          summary: `Network error ${response.status} on ${request.url} with ${relatedErrors.length} related console errors`,
          suggestions: this.getNetworkErrorSuggestions(response.status, request, relatedErrors),
          timeSpan: {
            start: Math.min(request.timestamp, ...relatedErrors.map(e => e.timestamp)),
            end: Math.max(response.timestamp, ...relatedErrors.map(e => e.timestamp)),
          },
        });
      }
    }
    
    return correlations;
  }
  
  private findCascadingErrors(messages: ConsoleMessage[]): ErrorCorrelation[] {
    const correlations: ErrorCorrelation[] = [];
    const errorMessages = messages.filter(m => m.level === 'error');
    
    // Sort by timestamp
    const sorted = [...errorMessages].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sorted.length; i++) {
      const cascade: ConsoleMessage[] = [sorted[i]];
      let j = i + 1;
      
      // Find errors that might be caused by the initial error
      while (j < sorted.length && sorted[j].timestamp - sorted[i].timestamp <= this.TIME_WINDOW) {
        if (this.isPotentiallyCaused(sorted[i], sorted[j])) {
          cascade.push(sorted[j]);
        }
        j++;
      }
      
      if (cascade.length > 2) {
        correlations.push({
          id: `cascade-${i}`,
          type: 'cascade',
          severity: cascade.length > 5 ? 'high' : 'medium',
          relatedItems: {
            consoleMessages: cascade,
          },
          summary: `Cascading errors: ${cascade.length} errors starting with "${cascade[0].text.substring(0, 50)}..."`,
          suggestions: [
            'Fix the initial error first, as it may be causing the subsequent errors',
            'Check for missing error handling in promise chains',
            'Verify that resources are loaded in the correct order',
          ],
          timeSpan: {
            start: cascade[0].timestamp,
            end: cascade[cascade.length - 1].timestamp,
          },
        });
        
        // Skip the cascaded errors in the outer loop
        i += cascade.length - 1;
      }
    }
    
    return correlations;
  }
  
  private findRepeatedErrors(messages: ConsoleMessage[]): ErrorCorrelation[] {
    const correlations: ErrorCorrelation[] = [];
    const errorMessages = messages.filter(m => m.level === 'error');
    const errorGroups = new Map<string, ConsoleMessage[]>();
    
    // Group similar errors
    for (const error of errorMessages) {
      let foundGroup = false;
      
      for (const [, group] of errorGroups) {
        if (this.areSimilarErrors(error.text, group[0].text)) {
          group.push(error);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        errorGroups.set(error.text, [error]);
      }
    }
    
    // Create correlations for repeated errors
    for (const [, group] of errorGroups) {
      if (group.length >= 3) {
        const timeSpan = group[group.length - 1].timestamp - group[0].timestamp;
        const frequency = timeSpan > 0 ? (group.length / timeSpan) * 1000 : 0; // errors per second
        
        correlations.push({
          id: `repeated-${group[0].timestamp}`,
          type: 'repeated-error',
          severity: frequency > 1 ? 'high' : 'medium',
          relatedItems: {
            consoleMessages: group,
          },
          summary: `Repeated error (${group.length} times): "${group[0].text.substring(0, 50)}..."`,
          suggestions: this.getRepeatedErrorSuggestions(group[0], frequency),
          timeSpan: {
            start: group[0].timestamp,
            end: group[group.length - 1].timestamp,
          },
        });
      }
    }
    
    return correlations;
  }
  
  private identifyRootCauses(correlations: ErrorCorrelation[]): void {
    for (const correlation of correlations) {
      if (correlation.type === 'cascade' && correlation.relatedItems.consoleMessages) {
        const firstError = correlation.relatedItems.consoleMessages[0];
        correlation.rootCause = {
          type: this.classifyError(firstError.text),
          message: firstError.text,
          source: firstError.url || 'unknown',
        };
      } else if (correlation.type === 'console-network' && correlation.relatedItems.networkRequests) {
        const netError = correlation.relatedItems.networkRequests[0];
        correlation.rootCause = {
          type: 'network',
          message: `HTTP ${netError.response?.status} on ${netError.request.method} ${netError.request.url}`,
          source: netError.request.url,
        };
      }
    }
  }
  
  private isNetworkErrorMessage(text: string): boolean {
    const patterns = [
      /failed to fetch/i,
      /network error/i,
      /ERR_NETWORK/i,
      /ERR_INTERNET_DISCONNECTED/i,
      /ERR_NAME_NOT_RESOLVED/i,
      /CORS/i,
      /xhr.*failed/i,
      /fetch.*failed/i,
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }
  
  private isPotentiallyCaused(first: ConsoleMessage, second: ConsoleMessage): boolean {
    // Check if errors are from the same source
    if (first.url && first.url === second.url) {
      return true;
    }
    
    // Check if second error mentions something from first error
    const firstKeywords = this.extractKeywords(first.text);
    const secondText = second.text.toLowerCase();
    
    return firstKeywords.some(keyword => secondText.includes(keyword));
  }
  
  private areSimilarErrors(text1: string, text2: string): boolean {
    // Remove variable parts like IDs, timestamps, etc.
    const normalize = (text: string) => {
      return text
        .replace(/\b\d+\b/g, 'NUM')
        .replace(/\b[a-f0-9]{8,}\b/gi, 'ID')
        .replace(/https?:\/\/[^\s]+/g, 'URL')
        .toLowerCase()
        .trim();
    };
    
    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);
    
    // Simple similarity check
    if (normalized1 === normalized2) return true;
    
    // Check if they share significant keywords
    const keywords1 = this.extractKeywords(text1);
    const keywords2 = this.extractKeywords(text2);
    const intersection = keywords1.filter(k => keywords2.includes(k));
    
    return intersection.length / Math.min(keywords1.length, keywords2.length) >= this.SIMILAR_ERROR_THRESHOLD;
  }
  
  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'is', 'at', 'in', 'on', 'and', 'or', 'to', 'a', 'an'];
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }
  
  private classifyError(text: string): string {
    if (/TypeError/i.test(text)) return 'TypeError';
    if (/ReferenceError/i.test(text)) return 'ReferenceError';
    if (/SyntaxError/i.test(text)) return 'SyntaxError';
    if (/RangeError/i.test(text)) return 'RangeError';
    if (/URIError/i.test(text)) return 'URIError';
    if (/SecurityError/i.test(text)) return 'SecurityError';
    if (/Network|fetch|xhr/i.test(text)) return 'NetworkError';
    return 'UnknownError';
  }
  
  private getNetworkErrorSuggestions(status: number, request: NetworkRequest, errors: ConsoleMessage[]): string[] {
    const suggestions: string[] = [];
    
    if (status === 404) {
      suggestions.push('Check if the URL is correct and the resource exists');
      suggestions.push('Verify API endpoint configuration');
    } else if (status === 401 || status === 403) {
      suggestions.push('Check authentication tokens and credentials');
      suggestions.push('Verify user permissions for this resource');
    } else if (status >= 500) {
      suggestions.push('Server error - check server logs for more details');
      suggestions.push('Implement retry logic with exponential backoff');
    }
    
    if (errors.some(e => /CORS/i.test(e.text))) {
      suggestions.push('Configure CORS headers on the server');
      suggestions.push('Check if credentials are being sent correctly');
    }
    
    return suggestions;
  }
  
  private getRepeatedErrorSuggestions(error: ConsoleMessage, frequency: number): string[] {
    const suggestions: string[] = [];
    
    if (frequency > 1) {
      suggestions.push('Error is occurring rapidly - possible infinite loop or recursive call');
      suggestions.push('Add debouncing or throttling to prevent repeated errors');
    }
    
    if (error.stackTrace) {
      suggestions.push('Check the stack trace to identify the source of repeated calls');
    }
    
    if (/undefined|null/i.test(error.text)) {
      suggestions.push('Add null/undefined checks before accessing properties');
      suggestions.push('Ensure all required data is loaded before use');
    }
    
    return suggestions;
  }
}