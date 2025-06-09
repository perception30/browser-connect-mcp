import CDP from 'chrome-remote-interface';
import { spawn, ChildProcess, exec } from 'child_process';
import { tmpdir, platform } from 'os';
import { accessSync } from 'fs';
import logger from './logger';
import { BrowserConnection, ConsoleMessage, NetworkRequest, NetworkResponse } from '../types';

export class BrowserManager {
  private connections: Map<string, CDP.Client> = new Map();
  private consoleMessages: Map<string, ConsoleMessage[]> = new Map();
  private networkRequests: Map<string, Map<string, NetworkRequest>> = new Map();
  private networkResponses: Map<string, Map<string, NetworkResponse>> = new Map();
  private browserProcess: ChildProcess | null = null;

  async connectToBrowser(host = 'localhost', port = 9222): Promise<BrowserConnection[]> {
    try {
      const targets = await CDP.List({ host, port });
      const connections: BrowserConnection[] = [];

      for (const target of targets) {
        if (target.type === 'page' && target.webSocketDebuggerUrl) {
          connections.push({
            id: target.id,
            debuggerUrl: target.webSocketDebuggerUrl,
            title: target.title || 'Untitled',
            type: target.type,
            connected: false,
          });
        }
      }

      return connections;
    } catch (error) {
      logger.error('Failed to connect to browser:', error);
      throw new Error(`Failed to connect to browser: ${error}`);
    }
  }

  async connectToTab(tabId: string, host = 'localhost', port = 9222): Promise<void> {
    try {
      const targets = await CDP.List({ host, port });
      const target = targets.find(t => t.id === tabId);

      if (!target) {
        throw new Error(`Tab with id ${tabId} not found`);
      }

      const client = await CDP({ target: tabId, host, port });
      this.connections.set(tabId, client);

      // Initialize storage for this tab
      this.consoleMessages.set(tabId, []);
      this.networkRequests.set(tabId, new Map());
      this.networkResponses.set(tabId, new Map());

      // Enable necessary domains
      await Promise.all([
        client.Console.enable(),
        client.Network.enable(),
        client.Page.enable(),
        client.Runtime.enable(),
      ]);

      // Set up event listeners
      this.setupConsoleListeners(tabId, client);
      this.setupNetworkListeners(tabId, client);

      logger.info(`Connected to tab ${tabId}`);
    } catch (error) {
      logger.error(`Failed to connect to tab ${tabId}:`, error);
      throw error;
    }
  }

  private setupConsoleListeners(tabId: string, client: CDP.Client): void {
    client.Console.messageAdded((params) => {
      const message: ConsoleMessage = {
        level: params.message.level as ConsoleMessage['level'],
        text: params.message.text,
        timestamp: Date.now(),
        url: params.message.url,
        lineNumber: params.message.line,
        columnNumber: params.message.column,
        stackTrace: (params.message as any).stackTrace,
      };

      const messages = this.consoleMessages.get(tabId) || [];
      messages.push(message);
      
      // Keep only last 10000 messages
      if (messages.length > 10000) {
        messages.shift();
      }
      
      this.consoleMessages.set(tabId, messages);
    });

    client.Runtime.consoleAPICalled((params) => {
      const message: ConsoleMessage = {
        level: params.type as ConsoleMessage['level'],
        text: params.args.map(arg => this.extractValue(arg)).join(' '),
        timestamp: params.timestamp,
        args: params.args,
        stackTrace: params.stackTrace,
      };

      const messages = this.consoleMessages.get(tabId) || [];
      messages.push(message);
      
      if (messages.length > 10000) {
        messages.shift();
      }
      
      this.consoleMessages.set(tabId, messages);
    });
  }

  private setupNetworkListeners(tabId: string, client: CDP.Client): void {
    const requests = this.networkRequests.get(tabId) || new Map();
    const responses = this.networkResponses.get(tabId) || new Map();

    client.Network.requestWillBeSent((params) => {
      const request: NetworkRequest = {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        headers: params.request.headers,
        timestamp: params.timestamp * 1000,
        postData: params.request.postData,
        hasPostData: params.request.hasPostData,
        resourceType: params.type,
      };

      requests.set(params.requestId, request);
      
      // Keep only last 5000 requests
      if (requests.size > 5000) {
        const firstKey = requests.keys().next().value;
        requests.delete(firstKey);
      }
    });

    client.Network.responseReceived((params) => {
      const requestTime = requests.get(params.requestId)?.timestamp;
      const response: NetworkResponse = {
        requestId: params.requestId,
        url: params.response.url,
        status: params.response.status,
        statusText: params.response.statusText,
        headers: params.response.headers,
        mimeType: params.response.mimeType,
        timestamp: params.timestamp * 1000,
        responseTime: requestTime ? params.timestamp * 1000 - requestTime : undefined,
        encodedDataLength: params.response.encodedDataLength,
      };

      responses.set(params.requestId, response);
      
      // Keep only last 5000 responses
      if (responses.size > 5000) {
        const firstKey = responses.keys().next().value;
        responses.delete(firstKey);
      }
    });
  }

  private extractValue(arg: any): string {
    if (!arg) return 'undefined';
    
    switch (arg.type) {
      case 'string':
      case 'number':
      case 'boolean':
        return String(arg.value);
      case 'undefined':
        return 'undefined';
      case 'null':
        return 'null';
      case 'object':
        if (arg.subtype === 'array') {
          return `Array(${arg.description})`;
        }
        return arg.description || JSON.stringify(arg.value || {});
      default:
        return arg.description || String(arg.value);
    }
  }

  async launchBrowser(executablePath?: string, url?: string, debugPort = 9222): Promise<void> {
    const chromePath = executablePath || this.findChromePath();
    
    if (!chromePath) {
      throw new Error('Chrome/Chromium executable not found');
    }

    const args = [
      `--remote-debugging-port=${debugPort}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + tmpdir() + '/browser-connect-mcp',
    ];

    // Add URL if provided
    if (url) {
      args.push(url);
    }

    this.browserProcess = spawn(chromePath, args);
    
    this.browserProcess.on('error', (error) => {
      logger.error('Browser process error:', error);
    });

    // Wait for browser to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private findChromePath(): string | null {
    const paths = [
      // macOS
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      // Linux
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/brave-browser',
      '/usr/bin/microsoft-edge',
      // Windows
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];

    for (const path of paths) {
      try {
        accessSync(path);
        return path;
      } catch {
        // Continue to next path
      }
    }

    return null;
  }

  async openUrlInDefaultBrowser(url: string): Promise<void> {
    const currentPlatform = platform();
    
    return new Promise((resolve, reject) => {
      let command: string;
      
      switch (currentPlatform) {
        case 'darwin': // macOS
          command = `open "${url}"`;
          break;
        case 'win32': // Windows
          command = `start "${url}"`;
          break;
        default: // Linux and others
          command = `xdg-open "${url}"`;
          break;
      }
      
      exec(command, (error) => {
        if (error) {
          logger.error('Failed to open URL in default browser:', error);
          reject(error);
        } else {
          logger.info(`Opened URL in default browser: ${url}`);
          resolve();
        }
      });
    });
  }

  async disconnectTab(tabId: string): Promise<void> {
    const client = this.connections.get(tabId);
    if (client) {
      await client.close();
      this.connections.delete(tabId);
      this.consoleMessages.delete(tabId);
      this.networkRequests.delete(tabId);
      this.networkResponses.delete(tabId);
      logger.info(`Disconnected from tab ${tabId}`);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [, client] of this.connections) {
      await client.close();
    }
    this.connections.clear();
    this.consoleMessages.clear();
    this.networkRequests.clear();
    this.networkResponses.clear();

    if (this.browserProcess) {
      this.browserProcess.kill();
      this.browserProcess = null;
    }
  }

  getConsoleMessages(tabId: string): ConsoleMessage[] {
    return this.consoleMessages.get(tabId) || [];
  }

  getNetworkRequests(tabId: string): NetworkRequest[] {
    const requests = this.networkRequests.get(tabId);
    return requests ? Array.from(requests.values()) : [];
  }

  getNetworkResponses(tabId: string): NetworkResponse[] {
    const responses = this.networkResponses.get(tabId);
    return responses ? Array.from(responses.values()) : [];
  }

  getConnectedTabs(): string[] {
    return Array.from(this.connections.keys());
  }

  isConnected(tabId: string): boolean {
    return this.connections.has(tabId);
  }
}