import { z } from 'zod';
import { Type, type FunctionDeclaration } from '@google/genai';

// ─── MCP Tool Definition ────────────────────────────────
export interface MCPTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
}

/**
 * Converts a Zod schema to a Gemini-compatible parameter schema.
 * Handles string, number, boolean, array, and enum types.
 */
export function zodToGeminiParams(schema: z.ZodObject<any>): {
  type: Type;
  properties: Record<string, any>;
  required: string[];
} {
  const shape = schema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodField = value as z.ZodTypeAny;
    properties[key] = zodFieldToGemini(zodField);

    // Check if field is required (not optional)
    if (!zodField.isOptional()) {
      required.push(key);
    }
  }

  return {
    type: Type.OBJECT,
    properties,
    required,
  };
}

function zodFieldToGemini(field: z.ZodTypeAny): Record<string, any> {
  const description = field.description || '';

  // Unwrap optional
  if (field instanceof z.ZodOptional) {
    return zodFieldToGemini(field._def.innerType);
  }

  // String
  if (field instanceof z.ZodString) {
    return { type: Type.STRING, description };
  }

  // Number
  if (field instanceof z.ZodNumber) {
    return { type: Type.NUMBER, description };
  }

  // Boolean
  if (field instanceof z.ZodBoolean) {
    return { type: Type.BOOLEAN, description };
  }

  // Enum
  if (field instanceof z.ZodEnum) {
    return {
      type: Type.STRING,
      description,
      enum: field._def.values,
    };
  }

  // Array
  if (field instanceof z.ZodArray) {
    return {
      type: Type.ARRAY,
      description,
      items: zodFieldToGemini(field._def.type),
    };
  }

  // Default fallback
  return { type: Type.STRING, description };
}
