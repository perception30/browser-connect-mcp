import { NetworkRequest, NetworkResponse } from '../types';

interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    cookies: { name: string; value: string }[];
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    cookies: { name: string; value: string }[];
    content: {
      size: number;
      compression?: number;
      mimeType: string;
      text?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: {
    blocked: number;
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
    ssl: number;
  };
}

interface HAR {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    browser?: {
      name: string;
      version: string;
    };
    pages: {
      startedDateTime: string;
      id: string;
      title: string;
      pageTimings: {
        onContentLoad?: number;
        onLoad?: number;
      };
    }[];
    entries: HAREntry[];
  };
}

export function exportToHAR(
  requests: NetworkRequest[],
  responses: NetworkResponse[],
  pageTitle: string = 'Captured Page',
  browserInfo?: { name: string; version: string }
): HAR {
  const responseMap = new Map(responses.map(r => [r.requestId, r]));
  const entries: HAREntry[] = [];
  
  // Find the earliest request time for page start
  const earliestTime = Math.min(...requests.map(r => r.timestamp));
  const pageId = `page_${Date.now()}`;
  
  for (const request of requests) {
    const response = responseMap.get(request.requestId);
    if (!response) continue;
    
    const entry: HAREntry = {
      startedDateTime: new Date(request.timestamp).toISOString(),
      time: response.responseTime || 0,
      request: {
        method: request.method,
        url: request.url,
        httpVersion: 'HTTP/1.1', // Default, CDP doesn't provide this
        headers: Object.entries(request.headers).map(([name, value]) => ({ name, value })),
        queryString: parseQueryString(request.url),
        cookies: parseCookies(request.headers['Cookie'] || request.headers['cookie'] || ''),
        headersSize: -1, // Not available in CDP
        bodySize: request.postData ? request.postData.length : 0,
        postData: request.postData ? {
          mimeType: request.headers['Content-Type'] || request.headers['content-type'] || 'application/octet-stream',
          text: request.postData
        } : undefined
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        httpVersion: 'HTTP/1.1', // Default
        headers: Object.entries(response.headers).map(([name, value]) => ({ name, value })),
        cookies: parseCookies(response.headers['Set-Cookie'] || response.headers['set-cookie'] || ''),
        content: {
          size: response.encodedDataLength || -1,
          compression: response.dataLength && response.encodedDataLength 
            ? response.dataLength - response.encodedDataLength 
            : undefined,
          mimeType: response.mimeType,
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: response.encodedDataLength || -1
      },
      cache: {},
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        send: -1,
        wait: response.responseTime || -1,
        receive: -1,
        ssl: -1
      }
    };
    
    entries.push(entry);
  }
  
  const har: HAR = {
    log: {
      version: '1.2',
      creator: {
        name: 'browser-connect-mcp',
        version: '0.1.0'
      },
      browser: browserInfo,
      pages: [{
        startedDateTime: new Date(earliestTime).toISOString(),
        id: pageId,
        title: pageTitle,
        pageTimings: {
          onContentLoad: -1,
          onLoad: -1
        }
      }],
      entries: entries.sort((a, b) => 
        new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime()
      )
    }
  };
  
  return har;
}

function parseQueryString(url: string): { name: string; value: string }[] {
  try {
    const urlObj = new URL(url);
    const params: { name: string; value: string }[] = [];
    urlObj.searchParams.forEach((value, name) => {
      params.push({ name, value });
    });
    return params;
  } catch {
    return [];
  }
}

function parseCookies(cookieString: string): { name: string; value: string }[] {
  if (!cookieString) return [];
  
  const cookies: { name: string; value: string }[] = [];
  const pairs = cookieString.split(/;\s*/);
  
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.split('=');
    if (name) {
      cookies.push({
        name: name.trim(),
        value: valueParts.join('=').trim()
      });
    }
  }
  
  return cookies;
}

export function saveHARToFile(har: HAR): string {
  const content = JSON.stringify(har, null, 2);
  return content;
}