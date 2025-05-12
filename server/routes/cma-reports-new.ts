import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { log } from '../vite';

/**
 * CMA Report Generation Routes
 * 
 * This module provides routes for generating Comparative Market Analysis (CMA) reports.
 * These reports compare a subject property with similar properties in the area to
 * determine market value and provide a professional analysis document for clients.
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

// Generate CMA Report
router.post('/generate-cma', upload.single('logo'), async (req, res) => {
  try {
    log('Generating CMA report', 'cma-reports');
    
    // Import jsPDF and autoTable dynamically
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
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
    
    // Generate PDF report
    const doc = new jsPDF();
    
    // Set up font and colors
    const primaryColor = options.brandingColor || '#071224';
    doc.setDrawColor(primaryColor);
    doc.setFillColor(primaryColor);
    
    // Process logo if uploaded
    let logoPath = '';
    if (req.file) {
      logoPath = req.file.filename;
    }
    
    // Add cover page
    if (options.includeCoverPage) {
      // Title
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text('Comparative Market Analysis', 105, 50, { align: 'center' });
      
      // Property address
      doc.setFontSize(18);
      doc.text(`${subjectProperty.address}`, 105, 70, { align: 'center' });
      doc.text(`${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`, 105, 80, { align: 'center' });
      
      // Logo
      if (logoPath) {
        const logoFile = path.join(uploadDir, logoPath);
        if (fs.existsSync(logoFile)) {
          doc.addImage(logoFile, 'JPEG', 75, 100, 60, 60);
        }
      }
      
      // Date
      const today = new Date();
      doc.setFontSize(12);
      doc.text(`Prepared on ${today.toLocaleDateString()}`, 105, 180, { align: 'center' });
      
      // Agent info
      doc.text(`Prepared by: ${options.agentName || 'Your Agent'}`, 105, 190, { align: 'center' });
      doc.text(`${options.companyName || 'Real Estate Company'}`, 105, 200, { align: 'center' });
      doc.text(`${options.agentPhone || '(555) 555-5555'}`, 105, 210, { align: 'center' });
      doc.text(`${options.agentEmail || 'agent@email.com'}`, 105, 220, { align: 'center' });
      
      // Page number
      doc.setFontSize(8);
      doc.text('Page 1', 105, 290, { align: 'center' });
      
      // Add a new page
      doc.addPage();
    }
    
    // Table of contents
    doc.setFontSize(18);
    doc.text('Table of Contents', 14, 20);
    doc.line(14, 25, 196, 25);
    
    doc.setFontSize(12);
    let tocY = 40;
    let pageNum = options.includeCoverPage ? 3 : 2;
    
    doc.text('Table of Contents', 14, tocY);
    doc.text(`${options.includeCoverPage ? 2 : 1}`, 190, tocY, { align: 'right' });
    tocY += 10;
    
    if (options.includePropertyDetails) {
      doc.text('Subject Property Details', 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeComps) {
      doc.text('Comparable Properties', 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeAdjustments) {
      doc.text('Adjustments Table', 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeCharts) {
      doc.text(`Charts & Graphs`, 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    // Add page number
    doc.setFontSize(8);
    doc.text(`Page ${options.includeCoverPage ? 2 : 1}`, 105, 290, { align: 'center' });
    
    // Subject property details
    if (options.includePropertyDetails) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Subject Property Details', 14, 20);
      doc.line(14, 25, 196, 25);
      
      // Property details
      doc.setFontSize(14);
      doc.text(subjectProperty.address, 14, 40);
      doc.text(`${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`, 14, 50);
      
      // Property specifications
      doc.setFontSize(12);
      const specs = [
        [`Price: $${Number(subjectProperty.price).toLocaleString()}`, `Bedrooms: ${subjectProperty.bedrooms}`],
        [`Square Feet: ${Number(subjectProperty.squareFeet).toLocaleString()}`, `Bathrooms: ${subjectProperty.bathrooms}`],
        [`Price/Sq.Ft: $${(Number(subjectProperty.price) / Number(subjectProperty.squareFeet)).toFixed(2)}`, `Year Built: ${subjectProperty.yearBuilt || 'N/A'}`],
        [`Property Type: ${subjectProperty.propertyType}`, `Status: ${subjectProperty.status}`],
        [`Lot Size: ${subjectProperty.lotSize ? subjectProperty.lotSize + ' acres' : 'N/A'}`, `Days on Market: ${subjectProperty.daysOnMarket || 'N/A'}`]
      ];
      
      let specY = 70;
      specs.forEach(specRow => {
        doc.text(specRow[0], 14, specY);
        doc.text(specRow[1], 105, specY);
        specY += 10;
      });
      
      // Add page number
      doc.setFontSize(8);
      doc.text(`Page ${options.includeCoverPage ? 3 : 2}`, 105, 290, { align: 'center' });
    }
    
    // Comparable properties
    if (options.includeComps) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Comparable Properties', 14, 20);
      doc.line(14, 25, 196, 25);
      
      // Prepare data for table
      const tableHeader = [['Address', 'Price', 'Sq.Ft', 'Beds', 'Baths', 'Price/Sq.Ft', 'Year', 'Status']];
      const tableData = comps.map(comp => [
        `${comp.address}, ${comp.city}`,
        `$${Number(comp.price).toLocaleString()}`,
        Number(comp.squareFeet).toLocaleString(),
        comp.bedrooms.toString(),
        comp.bathrooms.toString(),
        `$${(Number(comp.price) / Number(comp.squareFeet)).toFixed(2)}`,
        comp.yearBuilt?.toString() || 'N/A',
        comp.status
      ]);
      
      // Create comparison table
      (doc as any).autoTable({
        head: tableHeader,
        body: tableData,
        startY: 40,
        headStyles: { fillColor: hexToRgb(primaryColor) },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 25 },
          6: { cellWidth: 15 },
          7: { cellWidth: 20 }
        }
      });
      
      // Add page number
      doc.setFontSize(8);
      const compPage = options.includeCoverPage ? (options.includePropertyDetails ? 4 : 3) : (options.includePropertyDetails ? 3 : 2);
      doc.text(`Page ${compPage}`, 105, 290, { align: 'center' });
    }
    
    // Adjustments
    if (options.includeAdjustments) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Adjustments Table', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(12);
      doc.text('Adjustments are made to comparable properties to account for differences with the subject property.', 14, 40);
      doc.text('Positive adjustments increase the value of comps, while negative adjustments decrease their value.', 14, 50);
      
      // Prepare adjustment table
      const adjustmentHeader = [['Feature', 'Subject', ...comps.map((_, i) => `Comp ${i+1}`)]];
      
      const adjustmentRows = [
        ['Address', `${subjectProperty.address}`, ...comps.map(c => `${c.address}`)],
        ['Price', `$${Number(subjectProperty.price).toLocaleString()}`, ...comps.map(c => `$${Number(c.price).toLocaleString()}`)],
        ['Square Feet', `${Number(subjectProperty.squareFeet).toLocaleString()}`, ...comps.map(c => {
          const diff = Math.round(Number(subjectProperty.squareFeet) - Number(c.squareFeet));
          const adjustment = diff * 100; // Simplified: $100 per sq foot difference
          return `${Number(c.squareFeet).toLocaleString()} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Bedrooms', `${subjectProperty.bedrooms}`, ...comps.map(c => {
          const diff = Number(subjectProperty.bedrooms) - Number(c.bedrooms);
          const adjustment = diff * 5000; // Simplified: $5,000 per bedroom difference
          return `${c.bedrooms} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Bathrooms', `${subjectProperty.bathrooms}`, ...comps.map(c => {
          const diff = Number(subjectProperty.bathrooms) - Number(c.bathrooms);
          const adjustment = diff * 7500; // Simplified: $7,500 per bathroom difference
          return `${c.bathrooms} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Year Built', `${subjectProperty.yearBuilt || 'N/A'}`, ...comps.map(c => {
          if (!subjectProperty.yearBuilt || !c.yearBuilt) return `${c.yearBuilt || 'N/A'} (N/A)`;
          const diff = Number(subjectProperty.yearBuilt) - Number(c.yearBuilt);
          const adjustment = Math.round(diff * 1000); // Simplified: $1,000 per year difference
          return `${c.yearBuilt} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Total Adjustments', '-', ...comps.map(c => {
          // Calculate total adjustments - simplified
          let total = 0;
          
          // Square footage adjustment
          total += Math.round(Number(subjectProperty.squareFeet) - Number(c.squareFeet)) * 100;
          
          // Bedroom adjustment
          total += Math.round(Number(subjectProperty.bedrooms) - Number(c.bedrooms)) * 5000;
          
          // Bathroom adjustment
          total += Math.round(Number(subjectProperty.bathrooms) - Number(c.bathrooms)) * 7500;
          
          // Age adjustment
          if (subjectProperty.yearBuilt && c.yearBuilt) {
            total += Math.round(Number(subjectProperty.yearBuilt) - Number(c.yearBuilt)) * 1000;
          }
          
          return `${total >= 0 ? '+' : ''}$${Math.abs(total).toLocaleString()}`;
        })],
        ['Adjusted Value', `$${Number(subjectProperty.price).toLocaleString()}`, ...comps.map(c => {
          // Calculate adjusted value - simplified
          let adjustments = 0;
          
          // Square footage adjustment
          adjustments += Math.round(Number(subjectProperty.squareFeet) - Number(c.squareFeet)) * 100;
          
          // Bedroom adjustment
          adjustments += Math.round(Number(subjectProperty.bedrooms) - Number(c.bedrooms)) * 5000;
          
          // Bathroom adjustment
          adjustments += Math.round(Number(subjectProperty.bathrooms) - Number(c.bathrooms)) * 7500;
          
          // Age adjustment
          if (subjectProperty.yearBuilt && c.yearBuilt) {
            adjustments += Math.round(Number(subjectProperty.yearBuilt) - Number(c.yearBuilt)) * 1000;
          }
          
          const adjusted = Number(c.price) + adjustments;
          return `$${Math.abs(adjusted).toLocaleString()}`;
        })]
      ];
      
      // Create adjustment table
      (doc as any).autoTable({
        head: adjustmentHeader,
        body: adjustmentRows,
        startY: 70,
        headStyles: { fillColor: hexToRgb(primaryColor) },
        styles: {
          fontSize: 9,
          cellPadding: 2,
        }
      });
      
      // Add page number
      doc.setFontSize(8);
      const adjPage = options.includeCoverPage 
        ? (options.includePropertyDetails 
          ? (options.includeComps ? 5 : 4) 
          : (options.includeComps ? 4 : 3)) 
        : (options.includePropertyDetails 
          ? (options.includeComps ? 4 : 3) 
          : (options.includeComps ? 3 : 2));
      doc.text(`Page ${adjPage}`, 105, 290, { align: 'center' });
    }
    
    // Charts
    if (options.includeCharts) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Market Charts & Trends', 14, 20);
      doc.line(14, 25, 196, 25);
      
      // Add page number
      doc.setFontSize(8);
      const chartsPage = options.includeCoverPage 
        ? (options.includePropertyDetails 
          ? (options.includeComps 
            ? (options.includeAdjustments ? 6 : 5) 
            : (options.includeAdjustments ? 5 : 4)) 
          : (options.includeComps 
            ? (options.includeAdjustments ? 5 : 4) 
            : (options.includeAdjustments ? 4 : 3))) 
        : (options.includePropertyDetails 
          ? (options.includeComps 
            ? (options.includeAdjustments ? 5 : 4) 
            : (options.includeAdjustments ? 4 : 3)) 
          : (options.includeComps 
            ? (options.includeAdjustments ? 4 : 3) 
            : (options.includeAdjustments ? 3 : 2)));
      doc.text(`Page ${chartsPage}`, 105, 290, { align: 'center' });
    }
    
    // Add report notes if provided
    if (options.notes) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Notes', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(12);
      const splitNotes = doc.splitTextToSize(options.notes, 180);
      doc.text(splitNotes, 14, 40);
    }
    
    // Save PDF
    const fileName = `CMA_${subjectProperty.address.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save PDF to disk
    const pdfOutput = doc.output();
    fs.writeFileSync(filePath, Buffer.from(pdfOutput, 'binary'));
    
    // Create report record in database
    const report = await storage.createReport({
      userId: req.body.userId ? parseInt(req.body.userId) : 1, // Default to user ID 1 if not provided
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