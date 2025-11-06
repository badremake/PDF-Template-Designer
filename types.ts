// Define the data structures for PDF elements used throughout the application.
export type PdfElementType = 'text' | 'image' | 'line' | 'placeholder';

export interface BaseElement {
  id: string;
  type: PdfElementType;
  x: number;
  y: number;
  width: number;
  opacity: number;
}

export interface PdfText extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  height: number;
}

export interface PdfImage extends BaseElement {
  type: 'image';
  src: string; // base64 data URL
  height: number;
}

export interface PdfLine extends BaseElement {
  type: 'line';
  x2: number;
  y2: number;
  strokeWidth: number;
  strokeColor: string;
  // width is used for selection bounding box, not for rendering
  height: number;
}

export interface PdfPlaceholder extends BaseElement {
  type: 'placeholder';
  label: string;
  height: number;
  // Text styling for the dynamic content
  fontSize: number;
  fontFamily: string;
  color: string;
}

export type PdfElement = PdfText | PdfImage | PdfLine | PdfPlaceholder;

export interface PageSettings {
  width: number;
  height: number;
  unit: 'pt' | 'mm' | 'cm' | 'in';
}

export interface DesignFile {
  pageSettings: PageSettings;
  elements: PdfElement[];
}
