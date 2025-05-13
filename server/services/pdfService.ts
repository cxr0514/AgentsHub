/**
 * PDF Service
 * 
 * This service provides utilities for working with PDF generation,
 * including helper functions for jsPDF and making integration with
 * jsPDF-autotable easier.
 */

// Type definition for autoTable
// This helps TypeScript understand the autoTable function that gets added to jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Helper function to convert hex color to RGB array
export function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

// Initialize jsPDF with autoTable
export async function createPdfDocument() {
  // Import jsPDF directly
  const jsPDFModule = await import('jspdf');
  const { jsPDF } = jsPDFModule;
  
  // Import jspdf-autotable - this registers the autoTable plugin with jsPDF
  await import('jspdf-autotable');
  
  // Create a new document
  const doc = new jsPDF();
  
  return doc;
}

// Format currency values consistently
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `$${numValue.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })}`;
}

// Format percentages consistently
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Format number with commas for thousands
export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toLocaleString('en-US');
}

// Create appropriate text color based on background for readability
export function getTextColorForBackground(r: number, g: number, b: number): [number, number, number] {
  // Calculate brightness using the formula from WCAG
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // If the background is dark, use white text; otherwise, use black
  return brightness > 125 ? [0, 0, 0] : [255, 255, 255];
}

// Add page with title and subtitle
export function addPageWithTitle(
  doc: any, 
  title: string,
  subtitle?: string,
  primaryColor: [number, number, number] = [0, 0, 0]
) {
  doc.addPage();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(title, 14, 20);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(14, 25, 196, 25);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(subtitle, 14, 35);
    return 45; // Return the Y position after the subtitle
  }
  
  return 35; // Return the Y position after the title
}