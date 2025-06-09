import { ConsoleMessage, NetworkRequest, NetworkResponse } from '../types';

export interface AdvancedSearchOptions {
  // Pattern matching
  patterns?: {
    include?: string[];
    exclude?: string[];
    mode?: 'any' | 'all'; // any = OR, all = AND
  };
  
  // Advanced regex with named groups
  namedPatterns?: {
    [key: string]: string; // e.g., { error: 'Error:\\s*(.+)', userId: 'user[_-]?id[:\s]+([\\w-]+)' }
  };
  
  // Complex field matching
  fields?: {
    [fieldName: string]: {
      pattern?: string;
      operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
      caseSensitive?: boolean;
    };
  };
  
  // Correlation
  correlate?: {
    timeWindow?: number; // milliseconds
    fields?: string[]; // fields to group by
  };
}

export interface SearchResult<T> {
  item: T;
  matches?: {
    [key: string]: string | string[];
  };
  score?: number;
}

// Advanced pattern matcher with scoring
export class AdvancedMatcher {
  private compiledPatterns: Map<string, RegExp> = new Map();
  
  constructor(private options: AdvancedSearchOptions) {
    this.compilePatterns();
  }
  
  private compilePatterns(): void {
    // Compile named patterns
    if (this.options.namedPatterns) {
      for (const [name, pattern] of Object.entries(this.options.namedPatterns)) {
        try {
          this.compiledPatterns.set(name, new RegExp(pattern, 'gi'));
        } catch (e) {
          console.error(`Invalid regex pattern for ${name}: ${pattern}`);
        }
      }
    }
    
    // Compile include/exclude patterns
    if (this.options.patterns) {
      const { include, exclude } = this.options.patterns;
      
      if (include) {
        include.forEach((pattern, i) => {
          try {
            this.compiledPatterns.set(`include_${i}`, new RegExp(pattern, 'gi'));
          } catch (e) {
            console.error(`Invalid include pattern: ${pattern}`);
          }
        });
      }
      
      if (exclude) {
        exclude.forEach((pattern, i) => {
          try {
            this.compiledPatterns.set(`exclude_${i}`, new RegExp(pattern, 'gi'));
          } catch (e) {
            console.error(`Invalid exclude pattern: ${pattern}`);
          }
        });
      }
    }
  }
  
  matchConsoleMessage(message: ConsoleMessage): SearchResult<ConsoleMessage> | null {
    const text = message.text;
    const matches: { [key: string]: string | string[] } = {};
    let score = 0;
    
    // Check exclude patterns first
    if (this.options.patterns?.exclude) {
      for (let i = 0; i < this.options.patterns.exclude.length; i++) {
        const pattern = this.compiledPatterns.get(`exclude_${i}`);
        if (pattern && pattern.test(text)) {
          return null; // Excluded
        }
      }
    }
    
    // Check include patterns
    if (this.options.patterns?.include) {
      const mode = this.options.patterns.mode || 'any';
      let matchCount = 0;
      
      for (let i = 0; i < this.options.patterns.include.length; i++) {
        const pattern = this.compiledPatterns.get(`include_${i}`);
        if (pattern) {
          const match = text.match(pattern);
          if (match) {
            matchCount++;
            matches[`include_${i}`] = match[0];
            score += 10;
          }
        }
      }
      
      if (mode === 'all' && matchCount < this.options.patterns.include.length) {
        return null; // Didn't match all required patterns
      }
      if (mode === 'any' && matchCount === 0) {
        return null; // Didn't match any pattern
      }
    }
    
    // Check named patterns and extract groups
    if (this.options.namedPatterns) {
      for (const [name] of Object.entries(this.options.namedPatterns)) {
        const pattern = this.compiledPatterns.get(name);
        if (pattern) {
          const match = text.match(pattern);
          if (match) {
            matches[name] = match.length > 1 ? match.slice(1) : match[0];
            score += 5;
          }
        }
      }
    }
    
    // Field-specific matching
    if (this.options.fields) {
      for (const [fieldName, fieldOptions] of Object.entries(this.options.fields)) {
        const fieldValue = this.getFieldValue(message, fieldName);
        if (fieldValue && this.matchField(fieldValue, fieldOptions)) {
          matches[`field_${fieldName}`] = fieldValue;
          score += 3;
        }
      }
    }
    
    return score > 0 ? { item: message, matches, score } : null;
  }
  
  matchNetworkRequest(
    request: NetworkRequest,
    response?: NetworkResponse
  ): SearchResult<{ request: NetworkRequest; response?: NetworkResponse }> | null {
    const matches: { [key: string]: string | string[] } = {};
    let score = 0;
    
    // URL matching with patterns
    const url = request.url;
    
    // Check exclude patterns
    if (this.options.patterns?.exclude) {
      for (let i = 0; i < this.options.patterns.exclude.length; i++) {
        const pattern = this.compiledPatterns.get(`exclude_${i}`);
        if (pattern && pattern.test(url)) {
          return null;
        }
      }
    }
    
    // Check include patterns
    if (this.options.patterns?.include) {
      const mode = this.options.patterns.mode || 'any';
      let matchCount = 0;
      
      for (let i = 0; i < this.options.patterns.include.length; i++) {
        const pattern = this.compiledPatterns.get(`include_${i}`);
        if (pattern && pattern.test(url)) {
          matchCount++;
          matches[`url_pattern_${i}`] = url.match(pattern)![0];
          score += 10;
        }
      }
      
      if (mode === 'all' && matchCount < this.options.patterns.include.length) {
        return null;
      }
      if (mode === 'any' && matchCount === 0) {
        return null;
      }
    }
    
    // Named patterns on URL and headers
    if (this.options.namedPatterns) {
      for (const [name] of Object.entries(this.options.namedPatterns)) {
        const pattern = this.compiledPatterns.get(name);
        if (pattern) {
          // Check URL
          let match = url.match(pattern);
          if (match) {
            matches[`url_${name}`] = match.length > 1 ? match.slice(1) : match[0];
            score += 5;
          }
          
          // Check headers
          for (const [headerName, headerValue] of Object.entries(request.headers)) {
            match = headerValue.match(pattern);
            if (match) {
              matches[`header_${headerName}_${name}`] = match.length > 1 ? match.slice(1) : match[0];
              score += 3;
            }
          }
        }
      }
    }
    
    return score > 0 ? { item: { request, response }, matches, score } : null;
  }
  
  private getFieldValue(obj: any, fieldPath: string): string | undefined {
    const parts = fieldPath.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return String(current);
  }
  
  private matchField(value: string, options: any): boolean {
    const { pattern, operator = 'contains', caseSensitive = false } = options;
    if (!pattern) return false;
    
    const compareValue = caseSensitive ? value : value.toLowerCase();
    const comparePattern = caseSensitive ? pattern : pattern.toLowerCase();
    
    switch (operator) {
      case 'equals':
        return compareValue === comparePattern;
      case 'contains':
        return compareValue.includes(comparePattern);
      case 'startsWith':
        return compareValue.startsWith(comparePattern);
      case 'endsWith':
        return compareValue.endsWith(comparePattern);
      case 'regex':
        try {
          const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
          return regex.test(value);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }
}

// Correlation utilities
export function correlateMessages(
  messages: ConsoleMessage[],
  options: { timeWindow: number; fields?: string[] }
): Map<string, ConsoleMessage[]> {
  const groups = new Map<string, ConsoleMessage[]>();
  
  // Sort by timestamp
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const groupKey = options.fields 
      ? options.fields.map(f => getFieldValue(current, f) || 'unknown').join('_')
      : `group_${i}`;
    
    const group: ConsoleMessage[] = [current];
    
    // Find related messages within time window
    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j];
      if (next.timestamp - current.timestamp <= options.timeWindow) {
        if (!options.fields || options.fields.every(f => 
          getFieldValue(current, f) === getFieldValue(next, f)
        )) {
          group.push(next);
        }
      } else {
        break; // Outside time window
      }
    }
    
    if (group.length > 1) {
      groups.set(groupKey, group);
    }
  }
  
  return groups;
}

function getFieldValue(obj: any, fieldPath: string): string | undefined {
  const parts = fieldPath.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return String(current);
}

// Export search statistics
export interface SearchStatistics {
  totalSearched: number;
  totalMatched: number;
  matchRate: number;
  topPatterns: { pattern: string; count: number }[];
  avgScore: number;
}

export function calculateSearchStats<T>(
  results: SearchResult<T>[]
): SearchStatistics {
  const patternCounts = new Map<string, number>();
  let totalScore = 0;
  
  for (const result of results) {
    if (result.matches) {
      for (const key of Object.keys(result.matches)) {
        patternCounts.set(key, (patternCounts.get(key) || 0) + 1);
      }
    }
    totalScore += result.score || 0;
  }
  
  const topPatterns = Array.from(patternCounts.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalSearched: results.length,
    totalMatched: results.filter(r => r.score && r.score > 0).length,
    matchRate: results.length > 0 
      ? results.filter(r => r.score && r.score > 0).length / results.length 
      : 0,
    topPatterns,
    avgScore: results.length > 0 ? totalScore / results.length : 0
  };
}