declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ConversionOptions {
    styleMap?: string[] | string;
    includeDefaultStyleMap?: boolean;
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
  }

  export function convertToHtml(
    input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer; path?: string },
    options?: ConversionOptions
  ): Promise<ConversionResult>;

  export function convertToMarkdown(
    input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer; path?: string },
    options?: ConversionOptions
  ): Promise<ConversionResult>;

  export function extractRawText(
    input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer; path?: string }
  ): Promise<ConversionResult>;
}
