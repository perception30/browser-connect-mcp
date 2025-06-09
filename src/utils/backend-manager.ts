import CDP from 'chrome-remote-interface';
import logger from './logger.js';

interface LogEntry {
  timestamp: string;
  level?: string;
  message: string;
  metadata?: Record<string, any>;
  source: string;
  raw: string;
}

interface DebuggerEvent {
  type: 'paused' | 'console' | 'exception' | 'resumed';
  timestamp: string;
  data: any;
}

interface DebuggerScript {
  scriptId: string;
  url: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  hash?: string;
  isModule?: boolean;
}

interface BackendConnectionData {
  logs: LogEntry[];
  debuggerConnection?: CDP.Client;
  debuggerEvents: DebuggerEvent[];
  debuggerScripts: Map<string, DebuggerScript>;
  breakpoints: Map<string, any>;
}

export class BackendManager {
  private static instance: BackendManager;
  private connections: Map<string, BackendConnectionData> = new Map();
  
  private readonly MAX_LOGS_PER_SOURCE = 10000;
  private readonly MAX_DEBUGGER_EVENTS = 5000;
  
  private constructor() {}
  
  public static getInstance(): BackendManager {
    if (!BackendManager.instance) {
      BackendManager.instance = new BackendManager();
    }
    return BackendManager.instance;
  }
  
  public addLogs(source: string, logs: LogEntry[]): void {
    if (!this.connections.has(source)) {
      this.connections.set(source, {
        logs: [],
        debuggerEvents: [],
        debuggerScripts: new Map(),
        breakpoints: new Map()
      });
    }
    
    const connection = this.connections.get(source)!;
    connection.logs.push(...logs);
    
    // Keep only the latest logs if we exceed the limit
    if (connection.logs.length > this.MAX_LOGS_PER_SOURCE) {
      connection.logs = connection.logs.slice(-this.MAX_LOGS_PER_SOURCE);
    }
    
    logger.debug('Added logs', { source, count: logs.length, total: connection.logs.length });
  }
  
  public getLogs(source: string): LogEntry[] {
    const connection = this.connections.get(source);
    return connection?.logs || [];
  }
  
  public addDebuggerConnection(key: string, client: CDP.Client): void {
    if (!this.connections.has(key)) {
      this.connections.set(key, {
        logs: [],
        debuggerEvents: [],
        debuggerScripts: new Map(),
        breakpoints: new Map()
      });
    }
    
    const connection = this.connections.get(key)!;
    connection.debuggerConnection = client;
    
    logger.info('Added debugger connection', { key });
  }
  
  public getDebuggerConnection(key: string): CDP.Client | undefined {
    return this.connections.get(key)?.debuggerConnection;
  }
  
  public addDebuggerEvent(key: string, event: DebuggerEvent): void {
    const connection = this.connections.get(key);
    if (!connection) {
      logger.warn('No connection found for debugger event', { key });
      return;
    }
    
    connection.debuggerEvents.push(event);
    
    // Keep only the latest events if we exceed the limit
    if (connection.debuggerEvents.length > this.MAX_DEBUGGER_EVENTS) {
      connection.debuggerEvents = connection.debuggerEvents.slice(-this.MAX_DEBUGGER_EVENTS);
    }
    
    logger.debug('Added debugger event', { key, type: event.type });
  }
  
  public getDebuggerEvents(key: string): DebuggerEvent[] {
    const connection = this.connections.get(key);
    return connection?.debuggerEvents || [];
  }
  
  public addDebuggerScript(key: string, script: DebuggerScript): void {
    const connection = this.connections.get(key);
    if (!connection) {
      logger.warn('No connection found for debugger script', { key });
      return;
    }
    
    connection.debuggerScripts.set(script.scriptId, script);
    logger.debug('Added debugger script', { key, scriptId: script.scriptId, url: script.url });
  }
  
  public getDebuggerScripts(key: string): DebuggerScript[] {
    const connection = this.connections.get(key);
    if (!connection) return [];
    
    return Array.from(connection.debuggerScripts.values());
  }
  
  public addBreakpoint(key: string, breakpointId: string, breakpoint: any): void {
    const connection = this.connections.get(key);
    if (!connection) {
      logger.warn('No connection found for breakpoint', { key });
      return;
    }
    
    connection.breakpoints.set(breakpointId, breakpoint);
    logger.debug('Added breakpoint', { key, breakpointId });
  }
  
  public removeBreakpoint(key: string, breakpointId: string): void {
    const connection = this.connections.get(key);
    if (!connection) {
      logger.warn('No connection found for breakpoint removal', { key });
      return;
    }
    
    connection.breakpoints.delete(breakpointId);
    logger.debug('Removed breakpoint', { key, breakpointId });
  }
  
  public getBreakpoints(key: string): any[] {
    const connection = this.connections.get(key);
    if (!connection) return [];
    
    return Array.from(connection.breakpoints.values());
  }
  
  public async disconnectDebugger(key: string): Promise<void> {
    const connection = this.connections.get(key);
    if (!connection?.debuggerConnection) {
      logger.warn('No debugger connection to disconnect', { key });
      return;
    }
    
    try {
      await connection.debuggerConnection.close();
      logger.info('Disconnected debugger', { key });
    } catch (error) {
      logger.error('Error disconnecting debugger', { key, error });
    }
    
    // Clear the connection data
    this.connections.delete(key);
  }
  
  public clearLogs(source: string): void {
    const connection = this.connections.get(source);
    if (connection) {
      connection.logs = [];
      logger.info('Cleared logs', { source });
    }
  }
  
  public getAllConnections(): string[] {
    return Array.from(this.connections.keys());
  }
  
  public getConnectionInfo(key: string): any {
    const connection = this.connections.get(key);
    if (!connection) return null;
    
    return {
      hasDebugger: !!connection.debuggerConnection,
      logCount: connection.logs.length,
      eventCount: connection.debuggerEvents.length,
      scriptCount: connection.debuggerScripts.size,
      breakpointCount: connection.breakpoints.size
    };
  }
}