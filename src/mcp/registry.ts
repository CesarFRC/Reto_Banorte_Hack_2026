import type { MCPTool } from './types.js';
import { zodToJsonSchemaParams } from './types.js';

/**
 * Central registry for all MCP tools.
 * Handles registration, Groq/OpenAI format conversion, and execution.
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
   * Convert all registered tools to Groq/OpenAI function format
   */
  toGroqTools(): any[] {
    const groqTools: any[] = [];

    for (const tool of this.tools.values()) {
      groqTools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: zodToJsonSchemaParams(tool.parameters),
        }
      });
    }

    return groqTools;
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
