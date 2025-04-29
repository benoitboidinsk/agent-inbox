export interface InputSchemaField {
  name: string;
  label: string;
  type: 'string' | 'textarea' | 'number' | 'boolean' | 'array';
  required: boolean;
  placeholder?: string;
  description?: string;
  rows?: number;
  items?: {
    type: 'string' | 'number' | 'boolean';
    placeholder?: string;
  };
  minItems?: number;
  maxItems?: number;
}

export interface SchemaParsingOptions {
  preferTextareaForLongStrings?: boolean;
}
