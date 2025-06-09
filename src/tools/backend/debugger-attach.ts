import { z } from 'zod';
import CDP from 'chrome-remote-interface';
import WebSocket from 'ws';
import { BackendManager } from '../../utils/backend-manager.js';
import logger from '../../utils/logger.js';

export const BackendDebuggerAttachArgsSchema = z.object({
  host: z.string().default('localhost').describe('Debug host'),
  port: z.number().describe('Debug port (e.g., 9229 for Node.js)'),
  processId: z.string().optional().describe('Process ID to attach to'),
  type: z.enum(['node', 'deno', 'chrome']).default('node').describe('Runtime type')
});

export type BackendDebuggerAttachArgs = z.infer<typeof BackendDebuggerAttachArgsSchema>;

interface DebuggerInfo {
  id: string;
  title: string;
  url: string;
  type: string;
  webSocketDebuggerUrl?: string;
}

interface BreakpointInfo {
  id: string;
  location: {
    scriptId: string;
    lineNumber: number;
    columnNumber?: number;
  };
  resolved: boolean;
  condition?: string;
}

interface StackFrame {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
  scopeChain: any[];
}

export async function backendDebuggerAttach(args: BackendDebuggerAttachArgs): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const debuggerKey = `${args.host}:${args.port}`;
  
  try {
    logger.info('Attaching to debugger', { host: args.host, port: args.port });
    
    // First, get available debug targets
    const targets = await getDebugTargets(args.host, args.port);
    
    if (targets.length === 0) {
      throw new Error('No debug targets available. Ensure the process is running with --inspect flag.');
    }
    
    // Select target based on processId or first available
    let target = targets[0];
    if (args.processId) {
      const found = targets.find(t => t.id === args.processId || t.title.includes(args.processId!));
      if (found) target = found;
    }
    
    // Connect to the debugger
    const client = await CDP({
      host: args.host,
      port: args.port,
      target: target.id
    });
    
    // Store the client connection
    backendManager.addDebuggerConnection(debuggerKey, client);
    
    // Enable necessary domains
    await client.Debugger.enable();
    await client.Runtime.enable();
    await client.Profiler.enable();
    
    // Set up event listeners
    setupDebuggerEventListeners(client, debuggerKey);
    
    // Get initial state
    const scripts = await client.Debugger.getScriptSource({ scriptId: '0' }).catch(() => null);
    const runtimeInfo = await client.Runtime.evaluate({ 
      expression: 'process.versions', 
      returnByValue: true 
    }).catch(() => null);
    
    return {
      success: true,
      debugger: {
        connected: true,
        target: {
          id: target.id,
          title: target.title,
          type: target.type,
          url: target.url
        },
        runtime: runtimeInfo?.result?.value || {},
        capabilities: {
          debugging: true,
          profiling: true,
          heapSnapshot: args.type === 'node',
          coverage: true
        }
      },
      message: `Successfully attached to ${args.type} debugger at ${args.host}:${args.port}`
    };
    
  } catch (error) {
    logger.error('Failed to attach debugger', { error });
    return {
      isError: true,
      error: error instanceof Error ? error.message : 'Failed to attach debugger'
    };
  }
}

async function getDebugTargets(host: string, port: number): Promise<DebuggerInfo[]> {
  try {
    const response = await fetch(`http://${host}:${port}/json/list`);
    const targets = await response.json() as DebuggerInfo[];
    return targets;
  } catch (error) {
    logger.error('Failed to get debug targets', { error });
    return [];
  }
}

function setupDebuggerEventListeners(client: any, debuggerKey: string) {
  const backendManager = BackendManager.getInstance();
  
  // Debugger paused event
  client.Debugger.paused((params: any) => {
    logger.info('Debugger paused', { 
      reason: params.reason,
      callFrames: params.callFrames.length 
    });
    
    backendManager.addDebuggerEvent(debuggerKey, {
      type: 'paused',
      timestamp: new Date().toISOString(),
      data: {
        reason: params.reason,
        callFrames: params.callFrames,
        hitBreakpoints: params.hitBreakpoints
      }
    });
  });
  
  // Script parsed event
  client.Debugger.scriptParsed((params: any) => {
    logger.debug('Script parsed', { 
      scriptId: params.scriptId,
      url: params.url 
    });
    
    backendManager.addDebuggerScript(debuggerKey, {
      scriptId: params.scriptId,
      url: params.url,
      startLine: params.startLine,
      startColumn: params.startColumn,
      endLine: params.endLine,
      endColumn: params.endColumn,
      hash: params.hash,
      isModule: params.isModule
    });
  });
  
  // Console API called
  client.Runtime.consoleAPICalled((params: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: params.type,
      args: params.args,
      stackTrace: params.stackTrace
    };
    
    backendManager.addDebuggerEvent(debuggerKey, {
      type: 'console',
      timestamp: logEntry.timestamp,
      data: logEntry
    });
  });
  
  // Exception thrown
  client.Runtime.exceptionThrown((params: any) => {
    logger.warn('Exception thrown', { 
      text: params.exceptionDetails.text 
    });
    
    backendManager.addDebuggerEvent(debuggerKey, {
      type: 'exception',
      timestamp: new Date().toISOString(),
      data: params.exceptionDetails
    });
  });
}

// Additional debugger control functions that can be exposed as separate tools

export async function setBreakpoint(
  debuggerKey: string, 
  url: string, 
  lineNumber: number,
  condition?: string
): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    const result = await client.Debugger.setBreakpointByUrl({
      lineNumber,
      url,
      condition
    });
    
    return {
      success: true,
      breakpoint: {
        id: result.breakpointId,
        locations: result.locations
      }
    };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to set breakpoint' 
    };
  }
}

export async function removeBreakpoint(
  debuggerKey: string,
  breakpointId: string
): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    await client.Debugger.removeBreakpoint({ breakpointId });
    return { success: true };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to remove breakpoint' 
    };
  }
}

export async function stepOver(debuggerKey: string): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    await client.Debugger.stepOver();
    return { success: true };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to step over' 
    };
  }
}

export async function stepInto(debuggerKey: string): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    await client.Debugger.stepInto();
    return { success: true };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to step into' 
    };
  }
}

export async function stepOut(debuggerKey: string): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    await client.Debugger.stepOut();
    return { success: true };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to step out' 
    };
  }
}

export async function resume(debuggerKey: string): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    await client.Debugger.resume();
    return { success: true };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to resume' 
    };
  }
}

export async function evaluateExpression(
  debuggerKey: string,
  expression: string,
  callFrameId?: string
): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    const params: any = {
      expression,
      generatePreview: true,
      returnByValue: false
    };
    
    if (callFrameId) {
      params.callFrameId = callFrameId;
    }
    
    const result = await client.Debugger.evaluateOnCallFrame(params);
    
    return {
      success: true,
      result: result.result,
      exceptionDetails: result.exceptionDetails
    };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to evaluate expression' 
    };
  }
}

export async function getCallStack(debuggerKey: string): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const events = backendManager.getDebuggerEvents(debuggerKey);
  
  const pausedEvent = events
    .filter(e => e.type === 'paused')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
  if (!pausedEvent) {
    return { 
      isError: true, 
      error: 'Debugger not paused' 
    };
  }
  
  return {
    success: true,
    callFrames: pausedEvent.data.callFrames,
    reason: pausedEvent.data.reason
  };
}

export async function getVariables(
  debuggerKey: string,
  callFrameId: string,
  scopeIndex: number
): Promise<any> {
  const backendManager = BackendManager.getInstance();
  const client = backendManager.getDebuggerConnection(debuggerKey);
  
  if (!client) {
    return { isError: true, error: 'Debugger not connected' };
  }
  
  try {
    // Get the call frame
    const callStack = await getCallStack(debuggerKey);
    if (callStack.isError) return callStack;
    
    const callFrame = callStack.callFrames.find((f: any) => f.callFrameId === callFrameId);
    if (!callFrame) {
      return { isError: true, error: 'Call frame not found' };
    }
    
    const scope = callFrame.scopeChain[scopeIndex];
    if (!scope) {
      return { isError: true, error: 'Scope not found' };
    }
    
    // Get properties of the scope object
    const properties = await client.Runtime.getProperties({
      objectId: scope.object.objectId,
      ownProperties: true,
      generatePreview: true
    });
    
    return {
      success: true,
      variables: properties.result,
      scope: {
        type: scope.type,
        name: scope.name
      }
    };
  } catch (error) {
    return { 
      isError: true, 
      error: error instanceof Error ? error.message : 'Failed to get variables' 
    };
  }
}