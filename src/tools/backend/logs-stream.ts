import { z } from 'zod';
import { Tail } from 'tail';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { BackendManager } from '../../utils/backend-manager.js';
import logger from '../../utils/logger.js';

export const BackendLogsStreamArgsSchema = z.object({
  source: z.enum(['file', 'process', 'docker', 'stdout']).describe('Log source type'),
  target: z.string().describe('File path, process ID, container ID, or command'),
  filters: z.object({
    level: z.array(z.enum(['error', 'warn', 'info', 'debug', 'trace'])).optional(),
    pattern: z.string().optional().describe('Text pattern to search for'),
    regex: z.boolean().default(false).describe('Treat pattern as regex'),
    since: z.string().optional().describe('ISO timestamp to start from'),
    limit: z.number().default(1000).describe('Maximum number of logs to return')
  }).optional(),
  follow: z.boolean().default(false).describe('Follow log in real-time'),
  format: z.enum(['json', 'text', 'auto']).default('auto').describe('Log format')
});

export type BackendLogsStreamArgs = z.infer<typeof BackendLogsStreamArgsSchema>;

interface LogEntry {
  timestamp: string;
  level?: string;
  message: string;
  metadata?: Record<string, any>;
  source: string;
  raw: string;
}

export async function backendLogsStream(args: BackendLogsStreamArgs): Promise<any> {
  const backendManager = BackendManager.getInstance();
  
  try {
    logger.info('Starting log stream', { source: args.source, target: args.target });
    
    let logs: LogEntry[] = [];
    
    switch (args.source) {
      case 'file':
        logs = await streamFileLog(args.target, args.filters, args.format, args.follow);
        break;
        
      case 'process':
        logs = await streamProcessLog(args.target, args.filters, args.follow);
        break;
        
      case 'docker':
        logs = await streamDockerLog(args.target, args.filters, args.follow);
        break;
        
      case 'stdout':
        logs = await streamStdoutLog(args.target, args.filters, args.follow);
        break;
    }
    
    // Store logs in backend manager
    backendManager.addLogs(args.target, logs);
    
    // Apply filters
    let filteredLogs = logs;
    if (args.filters) {
      filteredLogs = filterLogs(logs, args.filters);
    }
    
    return {
      success: true,
      source: args.source,
      target: args.target,
      logCount: filteredLogs.length,
      logs: filteredLogs.slice(0, args.filters?.limit || 1000),
      streaming: args.follow
    };
    
  } catch (error) {
    logger.error('Failed to stream logs', { error });
    return {
      isError: true,
      error: error instanceof Error ? error.message : 'Failed to stream logs'
    };
  }
}

async function streamFileLog(
  filePath: string, 
  filters: any, 
  format: string,
  follow: boolean
): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Log file not found: ${filePath}`);
  }
  
  // Read existing content
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const entry = parseLogLine(line, format);
    if (entry) {
      logs.push(entry);
    }
  }
  
  // Follow log if requested
  if (follow) {
    const tail = new Tail(filePath);
    
    tail.on('line', (data: string) => {
      const entry = parseLogLine(data, format);
      if (entry) {
        logs.push(entry);
        // In real implementation, would emit this to connected clients
      }
    });
    
    tail.on('error', (error: Error) => {
      logger.error('Tail error', { error });
    });
  }
  
  return logs;
}

async function streamProcessLog(
  processId: string,
  filters: any,
  follow: boolean
): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  
  // For Node.js processes, we can use the debug port
  // This is a simplified implementation
  const debugUrl = `ws://127.0.0.1:9229/${processId}`;
  
  // In a real implementation, would connect to Node.js Inspector
  // and listen to Runtime.consoleAPICalled events
  
  return logs;
}

async function streamDockerLog(
  containerId: string,
  filters: any,
  follow: boolean
): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  
  return new Promise((resolve, reject) => {
    const args = ['logs'];
    if (follow) args.push('-f');
    args.push('--timestamps', containerId);
    
    const docker = spawn('docker', args);
    
    docker.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        const entry = parseDockerLogLine(line);
        if (entry) {
          logs.push(entry);
        }
      }
    });
    
    docker.stderr.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        const entry = parseDockerLogLine(line);
        if (entry) {
          entry.level = 'error';
          logs.push(entry);
        }
      }
    });
    
    docker.on('error', (error) => {
      reject(new Error(`Failed to run docker logs: ${error.message}`));
    });
    
    if (!follow) {
      docker.on('close', () => {
        resolve(logs);
      });
    } else {
      // Return current logs immediately when following
      setTimeout(() => resolve(logs), 1000);
    }
  });
}

async function streamStdoutLog(
  command: string,
  filters: any,
  follow: boolean
): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const proc = spawn(cmd, args, { shell: true });
    
    proc.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
          source: 'stdout',
          raw: line
        });
      }
    });
    
    proc.stderr.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: line,
          source: 'stderr',
          raw: line
        });
      }
    });
    
    proc.on('error', (error) => {
      reject(new Error(`Failed to run command: ${error.message}`));
    });
    
    if (!follow) {
      proc.on('close', () => {
        resolve(logs);
      });
    } else {
      // Return current logs immediately when following
      setTimeout(() => resolve(logs), 1000);
    }
  });
}

function parseLogLine(line: string, format: string): LogEntry | null {
  if (!line.trim()) return null;
  
  const timestamp = new Date().toISOString();
  
  // Auto-detect format
  if (format === 'auto') {
    if (line.startsWith('{') && line.endsWith('}')) {
      format = 'json';
    } else {
      format = 'text';
    }
  }
  
  if (format === 'json') {
    try {
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed.timestamp || parsed.time || timestamp,
        level: parsed.level || parsed.severity || 'info',
        message: parsed.message || parsed.msg || line,
        metadata: parsed,
        source: 'file',
        raw: line
      };
    } catch {
      // Fall back to text parsing
    }
  }
  
  // Text format parsing
  // Common patterns: [LEVEL] message, LEVEL: message, timestamp LEVEL message
  const patterns = [
    /^\[(\w+)\]\s*(.+)$/,  // [LEVEL] message
    /^(\w+):\s*(.+)$/,     // LEVEL: message
    /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\s+(\w+)\s+(.+)$/, // timestamp LEVEL message
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      if (match.length === 4) {
        // timestamp LEVEL message format
        return {
          timestamp: match[1],
          level: match[2].toLowerCase(),
          message: match[3],
          source: 'file',
          raw: line
        };
      } else {
        // LEVEL message format
        return {
          timestamp,
          level: match[1].toLowerCase(),
          message: match[2],
          source: 'file',
          raw: line
        };
      }
    }
  }
  
  // Default: treat entire line as message
  return {
    timestamp,
    message: line,
    source: 'file',
    raw: line
  };
}

function parseDockerLogLine(line: string): LogEntry | null {
  if (!line.trim()) return null;
  
  // Docker log format: timestamp stdout/stderr message
  const match = line.match(/^(\S+)\s+(stdout|stderr)\s+(.+)$/);
  
  if (match) {
    return {
      timestamp: match[1],
      level: match[2] === 'stderr' ? 'error' : 'info',
      message: match[3],
      source: 'docker',
      raw: line
    };
  }
  
  return {
    timestamp: new Date().toISOString(),
    message: line,
    source: 'docker',
    raw: line
  };
}

function filterLogs(logs: LogEntry[], filters: any): LogEntry[] {
  let filtered = [...logs];
  
  // Filter by level
  if (filters.level?.length > 0) {
    filtered = filtered.filter(log => 
      log.level && filters.level.includes(log.level)
    );
  }
  
  // Filter by pattern
  if (filters.pattern) {
    const regex = filters.regex 
      ? new RegExp(filters.pattern, 'i')
      : null;
      
    filtered = filtered.filter(log => {
      if (regex) {
        return regex.test(log.message) || regex.test(log.raw);
      } else {
        const pattern = filters.pattern.toLowerCase();
        return log.message.toLowerCase().includes(pattern) || 
               log.raw.toLowerCase().includes(pattern);
      }
    });
  }
  
  // Filter by timestamp
  if (filters.since) {
    const sinceTime = new Date(filters.since).getTime();
    filtered = filtered.filter(log => 
      new Date(log.timestamp).getTime() >= sinceTime
    );
  }
  
  return filtered;
}