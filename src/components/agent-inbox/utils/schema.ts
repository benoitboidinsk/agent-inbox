import { InputSchemaField, SchemaParsingOptions } from "../types/schema";

/**
 * Parses a raw schema from the LangGraph API into a list of input fields
 * that can be used to generate a form.
 */
export function parseGraphSchemaToInputFields(
  rawSchema: any,
  options: SchemaParsingOptions = {}
): InputSchemaField[] {
  if (!rawSchema) {
    return getDefaultSchema();
  }

  try {
    // Determine where the properties are located in the schema
    let properties: Record<string, any> = {};
    let required: string[] = [];

    if (rawSchema.input_schema) {
      // If the schema has an input_schema property, use that
      properties = rawSchema.input_schema.properties || {};
      required = rawSchema.input_schema.required || [];
    } else if (rawSchema.config_schema) {
      // If the schema has a config_schema property, use that
      properties = rawSchema.config_schema.properties || {};
      required = rawSchema.config_schema.required || [];
    } else if (rawSchema.properties) {
      // If the schema has properties directly, use those
      properties = rawSchema.properties;
      required = rawSchema.required || [];
    } else {
      // If we can't find properties, return the default schema
      return getDefaultSchema();
    }

    // Convert the properties to input fields
    return Object.entries(properties).map(([name, schema]) => {
      const field: InputSchemaField = {
        name,
        label: schema.title || formatFieldName(name),
        type: determineFieldType(schema, options),
        required: required.includes(name),
        description: schema.description,
      };

      // Add placeholder if available
      if (schema.examples && schema.examples.length > 0) {
        field.placeholder = String(schema.examples[0]);
      }

      // For textareas, add rows
      if (field.type === 'textarea') {
        field.rows = 5;
      }

      // For array fields, add items configuration
      if (field.type === 'array' && schema.items) {
        field.items = {
          type: schema.items.type === 'integer' ? 'number' : schema.items.type,
        };

        if (schema.items.examples && schema.items.examples.length > 0) {
          field.items.placeholder = String(schema.items.examples[0]);
        }

        // Add min/max items if specified
        if (schema.minItems !== undefined) {
          field.minItems = schema.minItems;
        }
        if (schema.maxItems !== undefined) {
          field.maxItems = schema.maxItems;
        }
      }

      return field;
    });
  } catch (error) {
    console.error("Error parsing schema:", error);
    return getDefaultSchema();
  }
}

/**
 * Determines the field type based on the schema
 */
function determineFieldType(
  schema: any,
  options: SchemaParsingOptions = {}
): InputSchemaField['type'] {
  const { preferTextareaForLongStrings = true } = options;

  if (schema.type === 'array') {
    return 'array';
  }

  if (schema.type === 'boolean') {
    return 'boolean';
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return 'number';
  }

  // String type handling
  if (schema.type === 'string') {
    // Check if this should be a textarea
    if (
      preferTextareaForLongStrings &&
      (schema.format === 'textarea' ||
        schema.maxLength > 100 ||
        (schema.examples &&
          schema.examples.some((ex: string) => ex && ex.length > 100)))
    ) {
      return 'textarea';
    }
    return 'string';
  }

  // Default to string for unknown types
  return 'string';
}

/**
 * Formats a field name for display (e.g., "input_text" -> "Input Text")
 */
function formatFieldName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Returns a default schema with a single textarea input
 */
function getDefaultSchema(): InputSchemaField[] {
  return [
    {
      name: 'input_prompt',
      label: 'Input',
      type: 'textarea',
      required: true,
      rows: 5,
      placeholder: 'Enter your input for the agent...',
      description: 'Provide instructions or data for the agent to process in this run.'
    }
  ];
}
