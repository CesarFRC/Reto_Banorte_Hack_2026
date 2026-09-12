import { z } from 'zod';

// ─── MCP Tool Definition ────────────────────────────────
export interface MCPTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
}

/**
 * Converts a Zod schema to a standard JSON Schema for OpenAI/Groq function calling.
 */
export function zodToJsonSchemaParams(schema: z.ZodObject<any>): {
  type: string;
  properties: Record<string, any>;
  required?: string[];
} {
  const shape = schema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodField = value as z.ZodTypeAny;
    properties[key] = zodFieldToJsonSchema(zodField);

    // Check if field is required (not optional)
    if (!zodField.isOptional()) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 && { required }),
  };
}

function zodFieldToJsonSchema(field: z.ZodTypeAny): Record<string, any> {
  const description = field.description || '';

  // Unwrap optional
  if (field instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(field._def.innerType);
  }

  // String
  if (field instanceof z.ZodString) {
    return { type: "string", description };
  }

  // Number
  if (field instanceof z.ZodNumber) {
    return { type: "number", description };
  }

  // Boolean
  if (field instanceof z.ZodBoolean) {
    return { type: "boolean", description };
  }

  // Enum
  if (field instanceof z.ZodEnum) {
    return {
      type: "string",
      description,
      enum: field._def.values,
    };
  }

  // Array
  if (field instanceof z.ZodArray) {
    return {
      type: "array",
      description,
      items: zodFieldToJsonSchema(field._def.type),
    };
  }

  // Default fallback
  return { type: "string", description };
}
