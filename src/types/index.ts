export interface BrowserConnection {
  id: string;
  debuggerUrl: string;
  title: string;
  type: string;
  connected: boolean;
}

export interface ConsoleMessage {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: number;
  args?: any[];
  stackTrace?: any;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  postData?: string;
  hasPostData?: boolean;
  resourceType?: string;
}

export interface NetworkResponse {
  requestId: string;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  mimeType: string;
  timestamp: number;
  responseTime?: number;
  encodedDataLength?: number;
  dataLength?: number;
}

export interface SearchOptions {
  pattern?: string;
  regex?: boolean;
  caseSensitive?: boolean;
  level?: ConsoleMessage['level'] | ConsoleMessage['level'][];
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface NetworkSearchOptions {
  urlPattern?: string;
  method?: string | string[];
  statusCode?: number | number[];
  statusRange?: { min: number; max: number };
  resourceType?: string | string[];
  minDuration?: number;
  maxDuration?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}