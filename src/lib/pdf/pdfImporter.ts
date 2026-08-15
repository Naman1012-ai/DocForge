import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { ExtractedTextItem, ImportedPdfResult } from './types';
import { reconstructPdfDocument } from './reconstructor';

export * from './types';
export * from './layoutAnalyzer';
export * from './reconstructor';

// Configure PDF.js worker for client-side local execution
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/legacy/build/pdf.worker.min.mjs`;
}

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Legacy compatibility wrapper for reconstructPdfDocument
 */
export function reconstructPdfToMarkdown(pageItemsList: ExtractedTextItem[][]): { markdown: string; warnings: string[] } {
  const result = reconstructPdfDocument(pageItemsList);
  return { markdown: result.markdown, warnings: result.warnings };
}

/**
 * Extracts selectable text and reconstructs structured Markdown from a PDF File or ArrayBuffer
 */
export async function extractPdfContent(
  fileOrBuffer: File | ArrayBuffer,
  originalFilename: string = 'Imported Document'
): Promise<ImportedPdfResult> {
  // 1. File Size Validation
  if (fileOrBuffer instanceof File && fileOrBuffer.size > MAX_PDF_SIZE_BYTES) {
    return {
      success: false,
      title: 'Import Failed',
      markdownContent: '',
      pageCount: 0,
      wordCount: 0,
      warnings: [],
      error: `This PDF is too large (${(fileOrBuffer.size / (1024 * 1024)).toFixed(1)}MB) to process in your browser. Maximum allowed size is 25MB.`,
    };
  }

  try {
    let dataBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      dataBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      dataBuffer = fileOrBuffer;
    }

    // 2. Load PDF document via PDF.js (Local in-browser)
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    if (pageCount === 0) {
      return {
        success: false,
        title: 'Empty PDF',
        markdownContent: '',
        pageCount: 0,
        wordCount: 0,
        warnings: ['The selected PDF contains 0 pages.'],
        error: 'The selected PDF contains no pages.',
      };
    }

    const pagesItemsList: ExtractedTextItem[][] = [];
    let totalExtractedChars = 0;

    // 3. Extract text items from every page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems: ExtractedTextItem[] = [];

      for (let i = 0; i < textContent.items.length; i++) {
        const item = textContent.items[i] as {
          str?: string;
          transform?: number[];
          width?: number;
          height?: number;
          fontName?: string;
        };

        if (item && typeof item.str === 'string') {
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const x = transform[4] || 0;
          const y = transform[5] || 0;
          const height = Math.abs(transform[3]) || item.height || 12;
          const width = item.width || 0;

          pageItems.push({
            str: item.str,
            x,
            y,
            height,
            width,
            fontName: item.fontName || 'sans-serif',
          });

          totalExtractedChars += item.str.trim().length;
        }
      }

      pagesItemsList.push(pageItems);
    }

    // 4. Scanned / Image-Only PDF Detection
    if (totalExtractedChars < 20) {
      return {
        success: false,
        title: 'Scanned PDF',
        markdownContent: '',
        pageCount,
        wordCount: 0,
        warnings: ['This PDF appears to be scanned or image-based. OCR is not currently supported in V1.'],
        error: 'This PDF appears to be scanned or image-based. DocForge could not extract selectable text.',
      };
    }

    // 5. Reconstruct logical structured Markdown with Phase 11 layout analysis
    const { markdown, summary, warnings } = reconstructPdfDocument(pagesItemsList);

    // 6. Clean Title derivation
    const rawBaseName = originalFilename
      .replace(/^.*[\\/]/, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[/\\:*?"<>|]/g, '');
    const derivedTitle =
      rawBaseName
        .replace(/[-_]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Imported PDF Document';

    return {
      success: true,
      title: derivedTitle,
      markdownContent: markdown,
      pageCount,
      wordCount: summary.wordCount,
      summary,
      warnings,
    };
  } catch (err: unknown) {
    console.error('PDF Import Error:', err);
    const errorObj = err as { name?: string; message?: string };

    if (errorObj?.name === 'PasswordException') {
      return {
        success: false,
        title: 'Protected PDF',
        markdownContent: '',
        pageCount: 0,
        wordCount: 0,
        warnings: [],
        error: 'This PDF is password protected and cannot be imported.',
      };
    }

    if (errorObj?.name === 'InvalidPDFException') {
      return {
        success: false,
        title: 'Invalid PDF',
        markdownContent: '',
        pageCount: 0,
        wordCount: 0,
        warnings: [],
        error: "That file doesn't appear to be a valid or readable PDF.",
      };
    }

    return {
      success: false,
      title: 'Import Error',
      markdownContent: '',
      pageCount: 0,
      wordCount: 0,
      warnings: [],
      error: errorObj?.message || "DocForge couldn't extract readable text from this PDF.",
    };
  }
}
