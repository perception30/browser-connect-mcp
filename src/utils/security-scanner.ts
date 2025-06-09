import { ConsoleMessage, NetworkRequest, NetworkResponse } from '../types';

export interface SecurityIssue {
  id: string;
  type: 'sensitive-data' | 'insecure-transmission' | 'cors-misconfiguration' | 'xss-risk' | 'exposed-error' | 'missing-headers';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: {
    source: 'console' | 'network';
    data: any;
    location?: string;
  };
  recommendations: string[];
  references?: string[];
}

export class SecurityScanner {
  private sensitivePatterns = [
    { pattern: /password[\s=:]+["']?([^"'\s]+)/gi, type: 'password' },
    { pattern: /api[_-]?key[\s=:]+["']?([a-z0-9\-_]+)/gi, type: 'api_key' },
    { pattern: /token[\s=:]+["']?([a-z0-9\-_]+)/gi, type: 'token' },
    { pattern: /secret[\s=:]+["']?([a-z0-9\-_]+)/gi, type: 'secret' },
    { pattern: /private[_-]?key[\s=:]+["']?([a-z0-9\-_]+)/gi, type: 'private_key' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
    { pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, type: 'credit_card' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
  ];
  
  private securityHeaders = [
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Content-Security-Policy',
    'Referrer-Policy',
    'Permissions-Policy',
  ];
  
  scanForVulnerabilities(
    messages: ConsoleMessage[],
    requests: NetworkRequest[],
    responses: NetworkResponse[]
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const responseMap = new Map(responses.map(r => [r.requestId, r]));
    
    // 1. Scan console for sensitive data
    issues.push(...this.scanConsoleForSensitiveData(messages));
    
    // 2. Scan network for insecure transmissions
    issues.push(...this.scanNetworkSecurity(requests, responseMap));
    
    // 3. Check for CORS misconfigurations
    issues.push(...this.scanCORSIssues(requests, responseMap));
    
    // 4. Check for XSS risks
    issues.push(...this.scanXSSRisks(messages));
    
    // 5. Check for exposed errors with sensitive info
    issues.push(...this.scanExposedErrors(messages));
    
    // 6. Check for missing security headers
    issues.push(...this.scanSecurityHeaders(requests, responseMap));
    
    // Sort by severity
    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  
  private scanConsoleForSensitiveData(messages: ConsoleMessage[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    for (const message of messages) {
      for (const { pattern, type } of this.sensitivePatterns) {
        const matches = message.text.match(pattern);
        if (matches) {
          issues.push({
            id: `console-sensitive-${message.timestamp}-${type}`,
            type: 'sensitive-data',
            severity: type === 'password' || type === 'private_key' ? 'critical' : 'high',
            title: `${type.replace(/_/g, ' ')} exposed in console`,
            description: `Sensitive data (${type}) was found in console logs. This could expose credentials to anyone with access to the browser console.`,
            evidence: {
              source: 'console',
              data: {
                message: message.text.substring(0, 200),
                timestamp: message.timestamp,
                level: message.level,
              },
              location: message.url,
            },
            recommendations: [
              `Remove all ${type} from console logs`,
              'Use environment variables for sensitive configuration',
              'Implement proper logging that filters sensitive data',
              'Use a secure credential management system',
            ],
            references: [
              'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
            ],
          });
        }
      }
    }
    
    return issues;
  }
  
  private scanNetworkSecurity(
    requests: NetworkRequest[],
    _responseMap: Map<string, NetworkResponse>
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    for (const request of requests) {
      // Check for sensitive data in URLs
      for (const { pattern, type } of this.sensitivePatterns) {
        if (pattern.test(request.url)) {
          issues.push({
            id: `url-sensitive-${request.requestId}-${type}`,
            type: 'sensitive-data',
            severity: 'high',
            title: `${type} exposed in URL`,
            description: `Sensitive data (${type}) found in URL. URLs are often logged and cached, making this a security risk.`,
            evidence: {
              source: 'network',
              data: {
                url: request.url,
                method: request.method,
              },
            },
            recommendations: [
              'Move sensitive data to request body or headers',
              'Use POST requests for sensitive operations',
              'Implement proper URL parameter encryption',
            ],
          });
        }
      }
      
      // Check for insecure transmission
      if (request.url.startsWith('http://') && !request.url.includes('localhost')) {
        const hassSensitiveData = 
          request.postData && this.containsSensitiveData(request.postData) ||
          this.containsSensitiveHeaders(request.headers);
        
        if (hassSensitiveData) {
          issues.push({
            id: `insecure-transmission-${request.requestId}`,
            type: 'insecure-transmission',
            severity: 'critical',
            title: 'Sensitive data transmitted over insecure connection',
            description: 'Sensitive data is being transmitted over HTTP instead of HTTPS, making it vulnerable to interception.',
            evidence: {
              source: 'network',
              data: {
                url: request.url,
                method: request.method,
                hasSensitiveData: true,
              },
            },
            recommendations: [
              'Use HTTPS for all data transmission',
              'Implement HSTS (HTTP Strict Transport Security)',
              'Redirect all HTTP traffic to HTTPS',
            ],
            references: [
              'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
            ],
          });
        }
      }
    }
    
    return issues;
  }
  
  private scanCORSIssues(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      if (!response) continue;
      
      const corsHeader = response.headers['access-control-allow-origin'] || 
                        response.headers['Access-Control-Allow-Origin'];
      
      if (corsHeader === '*') {
        const hasCredentials = response.headers['access-control-allow-credentials'] === 'true' ||
                              response.headers['Access-Control-Allow-Credentials'] === 'true';
        
        if (hasCredentials) {
          issues.push({
            id: `cors-wildcard-credentials-${request.requestId}`,
            type: 'cors-misconfiguration',
            severity: 'high',
            title: 'CORS wildcard with credentials',
            description: 'The server allows any origin (*) with credentials, which is a security risk.',
            evidence: {
              source: 'network',
              data: {
                url: request.url,
                headers: {
                  'Access-Control-Allow-Origin': corsHeader,
                  'Access-Control-Allow-Credentials': 'true',
                },
              },
            },
            recommendations: [
              'Specify exact allowed origins instead of using wildcard',
              'Implement proper CORS origin validation',
              'Review credential requirements for cross-origin requests',
            ],
            references: [
              'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
            ],
          });
        }
      }
    }
    
    return issues;
  }
  
  private scanXSSRisks(messages: ConsoleMessage[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const xssPatterns = [
      /<script[^>]*>.*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /eval\s*\(/gi,
      /innerHTML\s*=/gi,
      /document\.write/gi,
    ];
    
    for (const message of messages) {
      if (message.level === 'error') {
        for (const pattern of xssPatterns) {
          if (pattern.test(message.text)) {
            issues.push({
              id: `xss-risk-${message.timestamp}`,
              type: 'xss-risk',
              severity: 'high',
              title: 'Potential XSS vulnerability detected',
              description: 'Console error contains patterns that suggest potential XSS vulnerability.',
              evidence: {
                source: 'console',
                data: {
                  message: message.text.substring(0, 200),
                  timestamp: message.timestamp,
                },
                location: message.url,
              },
              recommendations: [
                'Sanitize all user input before rendering',
                'Use textContent instead of innerHTML',
                'Implement Content Security Policy (CSP)',
                'Avoid using eval() and similar functions',
              ],
              references: [
                'https://owasp.org/www-community/attacks/xss/',
              ],
            });
            break;
          }
        }
      }
    }
    
    return issues;
  }
  
  private scanExposedErrors(messages: ConsoleMessage[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const sensitivePathPatterns = [
      /\/home\/\w+/gi,
      /\/users\/\w+/gi,
      /c:\\users\\\w+/gi,
      /\/var\/www/gi,
      /node_modules/gi,
      /\.env/gi,
    ];
    
    const errorMessages = messages.filter(m => m.level === 'error');
    
    for (const message of errorMessages) {
      // Check for exposed file paths
      for (const pattern of sensitivePathPatterns) {
        if (pattern.test(message.text)) {
          issues.push({
            id: `exposed-path-${message.timestamp}`,
            type: 'exposed-error',
            severity: 'medium',
            title: 'Sensitive path information exposed in error',
            description: 'Error messages contain file system paths that could help attackers understand the server structure.',
            evidence: {
              source: 'console',
              data: {
                message: message.text.substring(0, 200),
                timestamp: message.timestamp,
              },
            },
            recommendations: [
              'Implement custom error pages that hide technical details',
              'Log detailed errors server-side only',
              'Use generic error messages for client-side display',
            ],
          });
          break;
        }
      }
      
      // Check for stack traces with sensitive info
      if (message.stackTrace && JSON.stringify(message.stackTrace).length > 500) {
        issues.push({
          id: `exposed-stacktrace-${message.timestamp}`,
          type: 'exposed-error',
          severity: 'low',
          title: 'Detailed stack trace exposed',
          description: 'Detailed stack traces can reveal application structure and libraries used.',
          evidence: {
            source: 'console',
            data: {
              message: message.text.substring(0, 100),
              stackTraceLength: JSON.stringify(message.stackTrace).length,
            },
          },
          recommendations: [
            'Disable detailed error messages in production',
            'Use error tracking services that keep details server-side',
          ],
        });
      }
    }
    
    return issues;
  }
  
  private scanSecurityHeaders(
    requests: NetworkRequest[],
    responseMap: Map<string, NetworkResponse>
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const checkedDomains = new Set<string>();
    
    for (const request of requests) {
      const response = responseMap.get(request.requestId);
      if (!response || response.status >= 400) continue;
      
      // Only check each domain once
      const domain = new URL(request.url).hostname;
      if (checkedDomains.has(domain)) continue;
      checkedDomains.add(domain);
      
      // Skip localhost
      if (domain === 'localhost' || domain === '127.0.0.1') continue;
      
      const missingHeaders: string[] = [];
      
      for (const header of this.securityHeaders) {
        const headerLower = header.toLowerCase();
        const hasHeader = Object.keys(response.headers).some(h => h.toLowerCase() === headerLower);
        
        if (!hasHeader) {
          missingHeaders.push(header);
        }
      }
      
      if (missingHeaders.length > 0) {
        issues.push({
          id: `missing-headers-${domain}`,
          type: 'missing-headers',
          severity: missingHeaders.includes('Strict-Transport-Security') ? 'high' : 'medium',
          title: `Missing security headers on ${domain}`,
          description: `Important security headers are missing, potentially exposing the application to various attacks.`,
          evidence: {
            source: 'network',
            data: {
              domain,
              missingHeaders,
              url: request.url,
            },
          },
          recommendations: [
            'Add Strict-Transport-Security header for HTTPS enforcement',
            'Add X-Content-Type-Options: nosniff to prevent MIME sniffing',
            'Add X-Frame-Options to prevent clickjacking',
            'Implement Content Security Policy (CSP)',
            'Add other security headers as appropriate',
          ],
          references: [
            'https://owasp.org/www-project-secure-headers/',
          ],
        });
      }
    }
    
    return issues;
  }
  
  private containsSensitiveData(text: string): boolean {
    return this.sensitivePatterns.some(({ pattern }) => pattern.test(text));
  }
  
  private containsSensitiveHeaders(headers: Record<string, string>): boolean {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    return Object.keys(headers).some(h => 
      sensitiveHeaders.includes(h.toLowerCase()) && headers[h]?.length > 0
    );
  }
}