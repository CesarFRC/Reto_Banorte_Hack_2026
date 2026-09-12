import type { MCPTool } from './types.js';
import { zodToGeminiParams } from './types.js';
import type { FunctionDeclaration } from '@google/genai';

/**
 * Central registry for all MCP tools.
 * Handles registration, Gemini format conversion, and execution.
 */
export class MCPRegistry {
  private tools = new Map<string, MCPTool>();

  /**
   * Register a tool in the registry
   */
  register(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`MCP Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once
   */
  registerAll(tools: MCPTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Convert all registered tools to Gemini FunctionDeclaration format
   */
  toGeminiTools(): { functionDeclarations: FunctionDeclaration[] } {
    const declarations: FunctionDeclaration[] = [];

    for (const tool of this.tools.values()) {
      declarations.push({
        name: tool.name,
        description: tool.description,
        parameters: zodToGeminiParams(tool.parameters),
      });
    }

    return { functionDeclarations: declarations };
  }

  /**
   * Execute a tool by name with parameter validation
   */
  async execute(
    name: string,
    params: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const tool = this.tools.get(name);

    if (!tool) {
      return { success: false, error: `Tool not found: ${name}` };
    }

    try {
      // Validate params with Zod
      const validatedParams = tool.parameters.parse(params);

      // Execute the tool
      const result = await tool.execute(validatedParams);

      return { success: true, result };
    } catch (err: any) {
      console.error(`❌ MCP Tool error [${name}]:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get the number of registered tools
   */
  get size(): number {
    return this.tools.size;
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry();
