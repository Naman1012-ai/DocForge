import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { PageSettings } from '../../models/settings';
import type { ThemeConfig } from '../../models/theme';
import { generatePdfFilename } from '../../utils/filename';

export interface ExportPdfOptions {
  element: HTMLElement | null;
  title: string;
  settings: PageSettings;
  theme: ThemeConfig;
  customFilename?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  pageCount: number;
  error?: string;
}

/**
 * Pre-flight asset check ensuring web fonts and embedded images are fully decoded
 */
async function waitForAssets(element: HTMLElement): Promise<void> {
  // 1. Wait for document fonts to load
  if ('fonts' in document && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check warning:', e);
    }
  }

  // 2. Wait for all images inside the element to load/decode
  const images = Array.from(element.querySelectorAll('img'));
  const imagePromises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't block export on broken image
      // Fallback timeout after 3s
      setTimeout(() => resolve(), 3000);
    });
  });

  await Promise.all(imagePromises);
}

/**
 * Exports the document element to a high-resolution, paginated PDF file
 */
export async function exportDocumentToPdf(options: ExportPdfOptions): Promise<ExportResult> {
  const { element, title, settings, customFilename } = options;
  const filename = customFilename ? generatePdfFilename(customFilename) : generatePdfFilename(title);

  let targetElement = element;
  if (!targetElement && typeof document !== 'undefined') {
    targetElement =
      (document.querySelector('.docforge-preview-viewport .docforge-document-renderer') as HTMLElement) ||
      (document.querySelector('.docforge-document-renderer') as HTMLElement) ||
      (document.querySelector('#document-print-root') as HTMLElement);
  }

  if (!targetElement) {
    return {
      success: false,
      filename,
      pageCount: 0,
      error: 'Document element not found in DOM.',
    };
  }

  try {
    // 1. Await font and image decoding
    await waitForAssets(targetElement);

    // 2. Determine Page Dimensions in Millimeters
    const isLetter = settings.format === 'letter';
    const isLegal = settings.format === 'legal';
    const isLandscape = settings.orientation === 'landscape';

    let pageWidthMm = isLetter ? 215.9 : isLegal ? 215.9 : 210.0;
    let pageHeightMm = isLetter ? 279.4 : isLegal ? 355.6 : 297.0;

    if (isLandscape) {
      const temp = pageWidthMm;
      pageWidthMm = pageHeightMm;
      pageHeightMm = temp;
    }

    // 3. Locate all discrete .docforge-sheet elements in DOM
    let sheetElements = Array.from(targetElement.querySelectorAll('.docforge-sheet')) as HTMLElement[];
    if (sheetElements.length === 0) {
      if (targetElement.classList.contains('docforge-sheet')) {
        sheetElements = [targetElement];
      } else {
        const allSheets = typeof document !== 'undefined'
          ? (Array.from(document.querySelectorAll('.docforge-sheet')) as HTMLElement[])
          : [];
        sheetElements = allSheets;
      }
    }

    if (sheetElements.length === 0) {
      return {
        success: false,
        filename,
        pageCount: 0,
        error: 'No document sheet elements found to export.',
      };
    }

    const totalPages = sheetElements.length;

    // 4. Initialize jsPDF instance
    const pdfFormat = isLetter ? 'letter' : isLegal ? 'legal' : 'a4';
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: pdfFormat,
      compress: true,
    });

    // 5. Render each discrete page sheet element directly to its PDF page
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageEl = sheetElements[pageIndex];

      if (pageIndex > 0) {
        pdf.addPage(pdfFormat, isLandscape ? 'landscape' : 'portrait');
      }

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: pageEl.offsetWidth || 794,
        windowHeight: pageEl.offsetHeight || 1123,
        onclone: (clonedDoc, clonedElement) => {
          // Normalize any screen zoom transforms in cloned DOM
          clonedDoc.querySelectorAll('.docforge-sheet-scaler').forEach((el) => {
            (el as HTMLElement).style.transform = 'none';
          });
          // Ensure off-screen print roots are visible and positioned cleanly in cloned DOM
          clonedDoc.querySelectorAll('.docforge-print-root, #document-print-root').forEach((el) => {
            const hEl = el as HTMLElement;
            hEl.style.position = 'static';
            hEl.style.left = 'auto';
            hEl.style.top = 'auto';
            hEl.style.opacity = '1';
            hEl.style.visibility = 'visible';
            hEl.style.display = 'block';
          });
          // Ensure target page sheet is opaque, visible, and unscaled
          clonedElement.style.opacity = '1';
          clonedElement.style.visibility = 'visible';
          clonedElement.style.display = 'flex';
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'relative';
        },
      });

      const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
    }

    // 6. Save & Download the PDF
    pdf.save(filename);

    return {
      success: true,
      filename,
      pageCount: totalPages,
    };
  } catch (error) {
    console.error('PDF Export Error:', error);
    return {
      success: false,
      filename,
      pageCount: 0,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during PDF generation.',
    };
  }
}

/**
 * Triggers native browser print dialog configured with document print rules
 */
export function triggerNativePrint(): void {
  window.print();
}
