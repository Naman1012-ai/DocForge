/**
 * Filename utility for safe, cross-platform PDF file naming
 */

/**
 * Sanitizes a document title into a safe, valid filesystem filename with .pdf extension
 */
export function generatePdfFilename(title: string, defaultName: string = 'docframe-document'): string {
  if (!title || typeof title !== 'string') {
    return `${defaultName}.pdf`;
  }

  // Remove control characters and invalid filesystem characters: / \ : * ? " < > |
  let sanitized = title
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[/\\:*?"<>|]/g, '')
    .trim();

  // If title was stripped down to nothing or only dots/spaces
  if (sanitized.length === 0 || /^[\s.]+$/.test(sanitized)) {
    sanitized = defaultName;
  }

  // Replace multiple spaces with a single dash
  sanitized = sanitized.replace(/\s+/g, '-').toLowerCase();

  // Strip trailing periods or dashes
  sanitized = sanitized.replace(/[-.]+$/, '');

  // Truncate to sensible length (max 80 chars) to prevent filesystem path errors
  if (sanitized.length > 80) {
    sanitized = sanitized.substring(0, 80).replace(/[-.]+$/, '');
  }

  // Ensure it doesn't end with duplicate .pdf
  if (sanitized.toLowerCase().endsWith('.pdf')) {
    return sanitized;
  }

  return `${sanitized}.pdf`;
}
