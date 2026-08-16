/**
 * DocFrame Phase 12 — DOCX Importer & Document Converter
 */

import mammoth from 'mammoth';
import { parseHtmlToMarkdown, type ImportedHtmlResult } from './htmlImporter';

export interface ImportedDocxResult {
  success: boolean;
  title: string;
  markdownContent: string;
  warnings: string[];
  summary?: ImportedHtmlResult['summary'];
  error?: string;
}

const MAX_DOCX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Extracts and converts a DOCX File or ArrayBuffer into clean DocFrame Markdown
 */
export async function extractDocxContent(
  fileOrBuffer: File | ArrayBuffer,
  originalFilename: string = 'Imported Word Document'
): Promise<ImportedDocxResult> {
  // 1. File Size Validation
  if (fileOrBuffer instanceof File && fileOrBuffer.size > MAX_DOCX_SIZE_BYTES) {
    return {
      success: false,
      title: 'Import Failed',
      markdownContent: '',
      warnings: [],
      error: `This DOCX file is too large (${(fileOrBuffer.size / (1024 * 1024)).toFixed(1)}MB) to process in your browser. Maximum allowed size is 25MB.`,
    };
  }

  try {
    let arrayBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      arrayBuffer = fileOrBuffer;
    }

    // 2. Convert DOCX to semantic HTML via Mammoth with style mappings
    const conversionResult = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Intense Quote'] => blockquote:fresh",
        ],
      }
    );

    const generatedHtml = conversionResult.value;
    const mammothMessages = conversionResult.messages || [];

    if (!generatedHtml || generatedHtml.trim().length === 0) {
      return {
        success: false,
        title: 'Empty Document',
        markdownContent: '',
        warnings: ['The DOCX document contains no readable text.'],
        error: 'The DOCX document contains no readable text content.',
      };
    }

    // 3. Convert HTML into structured Markdown
    const htmlResult = parseHtmlToMarkdown(generatedHtml, originalFilename);

    const warnings = [...htmlResult.warnings];
    mammothMessages.forEach((msg) => {
      if (msg.type === 'warning') {
        warnings.push(msg.message);
      }
    });

    return {
      success: true,
      title: htmlResult.title,
      markdownContent: htmlResult.markdownContent,
      warnings,
      summary: htmlResult.summary,
    };
  } catch (err: unknown) {
    console.error('DOCX Import Error:', err);
    const errorObj = err as { message?: string };
    return {
      success: false,
      title: 'Import Error',
      markdownContent: '',
      warnings: [],
      error: errorObj?.message || "Failed to process DOCX document. Please verify it is a valid .docx file.",
    };
  }
}
