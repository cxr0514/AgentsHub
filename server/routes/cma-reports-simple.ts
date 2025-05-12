import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { log } from '../vite';

/**
 * CMA Report Generation Routes (Simplified Version)
 * 
 * This module provides routes for generating Comparative Market Analysis (CMA) reports
 * using a simpler approach without relying on jsPDF autoTable.
 */

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  }
});

// Helper function to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

// Generate CMA Report - Simple version without autoTable
router.post('/generate-cma', upload.single('logo'), async (req, res) => {
  try {
    log('Generating CMA report with simplified method', 'cma-reports');
    
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    
    // Parse request data
    const subjectPropertyId = parseInt(req.body.subjectPropertyId);
    const compIds = JSON.parse(req.body.compIds) as number[];
    const options = JSON.parse(req.body.options);
    
    // Get subject property and comparable properties
    const subjectProperty = await storage.getProperty(subjectPropertyId);
    if (!subjectProperty) {
      return res.status(404).json({ message: 'Subject property not found' });
    }
    
    const comps = await Promise.all(
      compIds.map(async (id) => {
        const prop = await storage.getProperty(id);
        if (!prop) {
          throw new Error(`Comparable property with ID ${id} not found`);
        }
        return prop;
      })
    );
    
    // Get market data for the location
    const marketData = await storage.getMarketDataByLocation(
      subjectProperty.city,
      subjectProperty.state,
      subjectProperty.zipCode
    );
    
    // Generate a simple PDF report
    const doc = new jsPDF();
    
    // Set up font and colors
    const primaryColor = options.brandingColor || '#071224';
    
    // Logo if uploaded
    let logoPath = '';
    if (req.file) {
      logoPath = req.file.filename;
      const logoFile = path.join(uploadDir, logoPath);
      if (fs.existsSync(logoFile)) {
        try {
          doc.addImage(logoFile, 'JPEG', 10, 10, 30, 30);
        } catch (err) {
          log(`Warning: Could not add logo: ${err}`, 'cma-reports');
        }
      }
    }
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('Comparative Market Analysis', 105, 30, { align: 'center' });
    
    // Property address
    doc.setFontSize(16);
    doc.text(`${subjectProperty.address}`, 105, 40, { align: 'center' });
    doc.text(`${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`, 105, 50, { align: 'center' });
    
    // Date
    const today = new Date();
    doc.setFontSize(12);
    doc.text(`Prepared on ${today.toLocaleDateString()}`, 105, 60, { align: 'center' });
    
    // Agent info
    doc.text(`Prepared by: ${options.agentName || 'Your Agent'}`, 105, 70, { align: 'center' });
    
    // Divider line
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 80, 190, 80);
    
    // Subject property details
    doc.setFontSize(16);
    doc.text('Subject Property Details', 14, 90);
    
    doc.setFontSize(12);
    doc.text(`Address: ${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`, 14, 100);
    doc.text(`Price: $${Number(subjectProperty.price).toLocaleString()}`, 14, 110);
    doc.text(`Bedrooms: ${subjectProperty.bedrooms}`, 14, 120);
    doc.text(`Bathrooms: ${subjectProperty.bathrooms}`, 14, 130);
    doc.text(`Square Feet: ${Number(subjectProperty.squareFeet).toLocaleString()}`, 14, 140);
    doc.text(`Price/Sq.Ft: $${(Number(subjectProperty.price) / Number(subjectProperty.squareFeet)).toFixed(2)}`, 14, 150);
    doc.text(`Year Built: ${subjectProperty.yearBuilt || 'N/A'}`, 14, 160);
    doc.text(`Property Type: ${subjectProperty.propertyType}`, 14, 170);
    
    // Divider line
    doc.line(20, 180, 190, 180);
    
    // Comparable properties
    doc.setFontSize(16);
    doc.text('Comparable Properties', 14, 190);
    
    // Data rows for comparable properties
    doc.setFontSize(10);
    let y = 200;
    
    // Simple header
    doc.text('Address', 14, y);
    doc.text('Price', 80, y);
    doc.text('Sq.Ft', 110, y);
    doc.text('Beds', 130, y);
    doc.text('Baths', 150, y);
    doc.text('Year', 170, y);
    y += 10;
    
    // Draw a line under header
    doc.line(14, y-5, 190, y-5);
    
    // List each comparable property
    for (const comp of comps) {
      if (y > 270) {
        // Add new page if we're running out of space
        doc.addPage();
        y = 20;
      }
      
      doc.text(`${comp.address}, ${comp.city}`.substring(0, 40), 14, y);
      doc.text(`$${Number(comp.price).toLocaleString()}`, 80, y);
      doc.text(`${Number(comp.squareFeet).toLocaleString()}`, 110, y);
      doc.text(`${comp.bedrooms}`, 130, y);
      doc.text(`${comp.bathrooms}`, 150, y);
      doc.text(`${comp.yearBuilt || 'N/A'}`, 170, y);
      
      y += 10;
    }
    
    // Add a new page for adjustments
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Price Adjustments', 14, 20);
    doc.line(14, 25, 190, 25);
    
    doc.setFontSize(10);
    y = 40;
    
    // List adjustments
    for (const comp of comps) {
      doc.setFontSize(12);
      doc.text(`Adjustments for ${comp.address}`, 14, y);
      y += 10;
      
      doc.setFontSize(10);
      // Square footage adjustment
      const sqftDiff = Math.round(Number(subjectProperty.squareFeet) - Number(comp.squareFeet));
      const sqftAdjustment = sqftDiff * 100;
      doc.text(`Square Footage: ${Number(comp.squareFeet).toLocaleString()} sf vs ${Number(subjectProperty.squareFeet).toLocaleString()} sf`, 20, y);
      doc.text(`${sqftAdjustment >= 0 ? '+' : ''}$${Math.abs(sqftAdjustment).toLocaleString()}`, 160, y);
      y += 8;
      
      // Bedroom adjustment
      const bedDiff = Number(subjectProperty.bedrooms) - Number(comp.bedrooms);
      const bedAdjustment = bedDiff * 5000;
      doc.text(`Bedrooms: ${comp.bedrooms} vs ${subjectProperty.bedrooms}`, 20, y);
      doc.text(`${bedAdjustment >= 0 ? '+' : ''}$${Math.abs(bedAdjustment).toLocaleString()}`, 160, y);
      y += 8;
      
      // Bathroom adjustment
      const bathDiff = Number(subjectProperty.bathrooms) - Number(comp.bathrooms);
      const bathAdjustment = bathDiff * 7500;
      doc.text(`Bathrooms: ${comp.bathrooms} vs ${subjectProperty.bathrooms}`, 20, y);
      doc.text(`${bathAdjustment >= 0 ? '+' : ''}$${Math.abs(bathAdjustment).toLocaleString()}`, 160, y);
      y += 8;
      
      // Year built adjustment
      let yearAdjustment = 0;
      if (subjectProperty.yearBuilt && comp.yearBuilt) {
        const yearDiff = Number(subjectProperty.yearBuilt) - Number(comp.yearBuilt);
        yearAdjustment = yearDiff * 1000;
        doc.text(`Year Built: ${comp.yearBuilt} vs ${subjectProperty.yearBuilt}`, 20, y);
        doc.text(`${yearAdjustment >= 0 ? '+' : ''}$${Math.abs(yearAdjustment).toLocaleString()}`, 160, y);
        y += 8;
      }
      
      // Total adjustment
      const totalAdjustment = sqftAdjustment + bedAdjustment + bathAdjustment + yearAdjustment;
      doc.text(`Total Adjustment:`, 20, y);
      doc.text(`${totalAdjustment >= 0 ? '+' : ''}$${Math.abs(totalAdjustment).toLocaleString()}`, 160, y);
      y += 8;
      
      // Adjusted value
      const adjustedValue = Number(comp.price) + totalAdjustment;
      doc.text(`Adjusted Value:`, 20, y);
      doc.text(`$${adjustedValue.toLocaleString()}`, 160, y);
      y += 15;
    }
    
    // Add notes if provided
    if (options.notes) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Notes', 14, 20);
      doc.line(14, 25, 190, 25);
      
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(options.notes, 180);
      doc.text(splitNotes, 14, 40);
    }
    
    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save PDF
    const fileName = `CMA_${subjectProperty.address.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save PDF to disk
    const pdfOutput = doc.output();
    fs.writeFileSync(filePath, Buffer.from(pdfOutput, 'binary'));
    
    // Create report record in database
    const report = await storage.createReport({
      userId: req.body.userId ? parseInt(req.body.userId) : 1,
      title: `CMA for ${subjectProperty.address}`,
      type: 'CMA',
      properties: {
        filePath: fileName,
        adjustments: options.includeAdjustments,
        charts: options.includeCharts
      },
      propertyId: subjectPropertyId
    });
    
    // Return success response
    return res.status(200).json({
      message: 'CMA report generated successfully',
      reportId: report.id,
      fileName: fileName,
      downloadUrl: `/api/reports/download/${report.id}`
    });
    
  } catch (err) {
    const error = err as Error;
    log(`Error generating CMA report: ${error.message}`, 'cma-reports');
    return res.status(500).json({ message: `Failed to generate CMA report: ${error.message}` });
  }
});

// Download report endpoint
router.get('/download/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = await storage.getReport(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Extract filePath from the properties JSON
    const reportProperties = report.properties as any;
    const filePath = path.join(process.cwd(), 'uploads', reportProperties.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Report file not found' });
    }
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportProperties.filePath}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: `Failed to download report: ${error.message}` });
  }
});

export default router;