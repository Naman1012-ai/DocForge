/**
 * Normalized Document Block Representation
 * Decouples Markdown source parsing from Phase 3 document rendering
 */

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'listItem'
  | 'blockquote'
  | 'code'
  | 'table'
  | 'thematicBreak'
  | 'image'
  | 'html';

export interface InlineNode {
  type: 'text' | 'emphasis' | 'strong' | 'delete' | 'inlineCode' | 'link' | 'image';
  value?: string;
  url?: string;
  title?: string;
  alt?: string;
  children?: InlineNode[];
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  children?: InlineNode[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  children: InlineNode[];
  rawText: string;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  start?: number;
  items: ListItemBlock[];
}

export interface ListItemBlock {
  type: 'listItem';
  checked?: boolean | null; // For GFM task lists [ ] / [x]
  children: (ParagraphBlock | ListBlock | InlineNode)[];
}

export interface BlockquoteBlock {
  type: 'blockquote';
  children: DocumentBlock[];
}

export interface CodeBlock {
  type: 'code';
  lang?: string;
  value: string;
}

export interface TableCell {
  value: string;
  align?: 'left' | 'center' | 'right' | null;
}

export interface TableRow {
  cells: TableCell[];
  isHeader?: boolean;
}

export interface TableBlock {
  type: 'table';
  alignments: ('left' | 'center' | 'right' | null)[];
  header: TableRow;
  rows: TableRow[];
}

export interface ThematicBreakBlock {
  type: 'thematicBreak';
}

export interface ImageBlock {
  type: 'image';
  url: string;
  alt?: string;
  title?: string;
}

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | ListItemBlock
  | BlockquoteBlock
  | CodeBlock
  | TableBlock
  | ThematicBreakBlock
  | ImageBlock;

export interface NormalizedDocument {
  title: string;
  blocks: DocumentBlock[];
  sanitizedHtml: string;
}
