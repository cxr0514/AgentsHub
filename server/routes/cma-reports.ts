import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
// Import jsPDF correctly
import { jsPDF } from 'jspdf';
// Need to add 'jspdf-autotable' for PDF table generation
// Note: This import adds the autoTable method to the jsPDF prototype
import 'jspdf-autotable';
import { log } from '../vite';

// Since TypeScript doesn't know about the autoTable method that's added by jspdf-autotable
// Define a helper function to type cast and call autoTable
function addAutoTable(doc: jsPDF, options: any) {
  return (doc as any).autoTable(options);
}

/**
 * CMA Report Generation Routes
 * 
 * This module provides routes for generating Comparative Market Analysis (CMA) reports.
 * These reports compare a subject property with similar properties in the area to
 * determine market value and provide a professional analysis document for clients.
 * 
 * Note on TypeScript usage with jsPDF:
 * We use (doc as any).autoTable because the jspdf-autotable types aren't properly included
 * in the TypeScript definitions. This is a common workaround for this library.
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

// Generate CMA Report
router.post('/generate-cma', upload.single('logo'), async (req, res) => {
  try {
    log('Generating CMA report', 'cma-reports');
    
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
    doc.setTextColor(primaryColor);
    
    // Cover page
    if (options.includeCoverPage) {
      doc.setFontSize(24);
      doc.text(options.reportTitle || 'Comparative Market Analysis', 105, 50, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text(subjectProperty.address, 105, 70, { align: 'center' });
      doc.text(`${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`, 105, 80, { align: 'center' });
      
      // Add company logo if provided
      if (req.file) {
        try {
          const logoPath = req.file.path;
          doc.addImage(logoPath, 'PNG', 75, 20, 60, 20);
        } catch (error) {
          log('Error adding logo to PDF', 'cma-reports');
        }
      }
      
      // Add agent information
      if (options.agentName) {
        doc.setFontSize(12);
        doc.text('Prepared by:', 105, 110, { align: 'center' });
        doc.setFontSize(14);
        doc.text(options.agentName, 105, 120, { align: 'center' });
        
        if (options.agentEmail || options.agentPhone) {
          doc.setFontSize(10);
          const contactInfo = [];
          if (options.agentEmail) contactInfo.push(options.agentEmail);
          if (options.agentPhone) contactInfo.push(options.agentPhone);
          doc.text(contactInfo.join(' | '), 105, 128, { align: 'center' });
        }
      }
      
      // Add client information
      if (options.clientName) {
        doc.setFontSize(12);
        doc.text('Prepared for:', 105, 145, { align: 'center' });
        doc.setFontSize(14);
        doc.text(options.clientName, 105, 155, { align: 'center' });
        
        if (options.clientEmail) {
          doc.setFontSize(10);
          doc.text(options.clientEmail, 105, 163, { align: 'center' });
        }
      }
      
      // Add date
      const today = new Date();
      doc.setFontSize(10);
      doc.text(`Report Date: ${today.toLocaleDateString()}`, 105, 180, { align: 'center' });
      
      // Add page number
      doc.setFontSize(8);
      doc.text('Page 1', 105, 290, { align: 'center' });
      
      doc.addPage();
    }
    
    // Table of contents
    doc.setFontSize(18);
    doc.text('Table of Contents', 14, 20);
    doc.line(14, 25, 196, 25);
    
    let pageNum = options.includeCoverPage ? 3 : 2;
    let tocY = 40;
    
    doc.setFontSize(12);
    
    if (options.includePropertyDetails) {
      doc.text(`Subject Property Details`, 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeComps) {
      doc.text(`Comparable Properties`, 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeAdjustments) {
      doc.text(`Adjustment Analysis`, 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeMarketAnalysis) {
      doc.text(`Market Analysis`, 14, tocY);
      doc.text(`${pageNum}`, 190, tocY, { align: 'right' });
      pageNum++;
      tocY += 10;
    }
    
    if (options.includeMaps) {
      doc.text(`Location Maps`, 14, tocY);
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
      addAutoTable(doc, {
        head: tableHeader,
        body: tableData,
        startY: 40,
        headStyles: { fillColor: primaryColor },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add page number
      const pageNumY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.text(`Page ${options.includeCoverPage ? 4 : 3}`, 105, pageNumY < 270 ? 290 : pageNumY + 10, { align: 'center' });
    }
    
    // Adjustment analysis
    if (options.includeAdjustments) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Adjustment Analysis', 14, 20);
      doc.line(14, 25, 196, 25);
      
      // Explanation text
      doc.setFontSize(10);
      doc.text('The following table shows price adjustments made to comparable properties to account for differences', 14, 40);
      doc.text('with the subject property. A positive adjustment increases the comparable\'s value, while a negative', 14, 50);
      doc.text('adjustment decreases its value.', 14, 60);
      
      // Adjustment table - simplified example
      const adjustmentHeader = [['Feature', 'Subject Property', ...comps.map((_, i) => `Comp ${i+1}`)]]
      const adjustmentRows = [
        ['Base Price', `$${subjectProperty.price.toLocaleString()}`, ...comps.map(c => `$${c.price.toLocaleString()}`)],
        ['Square Footage', subjectProperty.squareFeet.toString(), ...comps.map(c => {
          const diff = Number(subjectProperty.squareFeet) - Number(c.squareFeet);
          const adjustment = Math.round(diff * 100); // Simplified: $100 per sq ft difference
          return `${c.squareFeet} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Bedrooms', subjectProperty.bedrooms.toString(), ...comps.map(c => {
          const diff = Number(subjectProperty.bedrooms) - Number(c.bedrooms);
          const adjustment = Math.round(diff * 5000); // Simplified: $5,000 per bedroom
          return `${c.bedrooms} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Bathrooms', subjectProperty.bathrooms.toString(), ...comps.map(c => {
          const diff = Number(subjectProperty.bathrooms) - Number(c.bathrooms);
          const adjustment = Math.round(diff * 7500); // Simplified: $7,500 per bathroom
          return `${c.bathrooms} (${adjustment >= 0 ? '+' : ''}$${Math.abs(adjustment).toLocaleString()})`;
        })],
        ['Age', subjectProperty.yearBuilt?.toString() || 'N/A', ...comps.map(c => {
          if (!subjectProperty.yearBuilt || !c.yearBuilt) return 'N/A';
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
      addAutoTable(doc, {
        head: adjustmentHeader,
        body: adjustmentRows,
        startY: 70,
        headStyles: { fillColor: primaryColor },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add page number
      const pageNumY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.text(`Page ${options.includeCoverPage ? 5 : 4}`, 105, pageNumY < 270 ? 290 : pageNumY + 10, { align: 'center' });
    }
    
    // Market analysis
    if (options.includeMarketAnalysis && marketData.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Market Analysis', 14, 20);
      doc.line(14, 25, 196, 25);
      
      // Market data
      const market = marketData[0]; // Use the first market data entry
      
      doc.setFontSize(14);
      doc.text(`Market Overview: ${market.city}, ${market.state}`, 14, 40);
      
      doc.setFontSize(10);
      doc.text(`The following data represents current market conditions in ${market.city}, ${market.state}`, 14, 55);
      doc.text(`for properties similar to the subject property.`, 14, 65);
      
      // Market statistics
      doc.setFontSize(12);
      const marketStats = [
        [`Median Sale Price: $${market.medianPrice ? parseFloat(market.medianPrice).toLocaleString() : 'N/A'}`, `Avg. Days on Market: ${market.daysOnMarket || 'N/A'}`],
        [`Price per Sq.Ft: $${market.averagePricePerSqft ? parseFloat(market.averagePricePerSqft).toFixed(2) : 'N/A'}`, `Inventory: ${market.activeListings || 0} active listings`],
        [`Monthly Change: ${market.inventoryMonths ? (parseFloat(market.inventoryMonths) * 100).toFixed(2) : '0.00'}%`, `Year: ${market.year}`],
        [`Sale-to-List Ratio: ${market.saleToListRatio ? (parseFloat(market.saleToListRatio) * 100).toFixed(1) : '99.0'}%`, `Market Type: ${market.inventoryMonths ? (parseFloat(market.inventoryMonths) < 3 ? 'Seller\'s Market' : parseFloat(market.inventoryMonths) > 6 ? 'Buyer\'s Market' : 'Balanced Market') : 'Balanced Market'}`]
      ];
      
      let statY = 85;
      marketStats.forEach(statRow => {
        doc.text(statRow[0], 14, statY);
        doc.text(statRow[1], 105, statY);
        statY += 10;
      });
      
      // Market trends description
      doc.setFontSize(14);
      doc.text('Market Trends', 14, 130);
      
      doc.setFontSize(10);
      const marketTrendsText = `Based on data from ${market.city}, ${market.state}, the real estate market shows a median home price of ${market.medianPrice ? "$" + parseFloat(market.medianPrice).toLocaleString() : "N/A"} with properties spending an average of ${market.daysOnMarket || "N/A"} days on the market. The inventory of homes available for sale indicates ${market.inventoryMonths ? parseFloat(market.inventoryMonths) < 3 ? "a strong seller's market with limited inventory" : parseFloat(market.inventoryMonths) > 6 ? "a buyer's market with ample inventory" : "a balanced market with moderate inventory" : "a balanced market"}.`;
      
      doc.text(marketTrendsText, 14, 145, {
        maxWidth: 180,
        lineHeightFactor: 1.5
      });
      
      // Add page number
      doc.setFontSize(8);
      doc.text(`Page ${options.includeCoverPage ? 6 : 5}`, 105, 290, { align: 'center' });
    }
    
    // Add notes if provided
    if (options.notes) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Additional Notes', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(10);
      doc.text(options.notes, 14, 40, {
        maxWidth: 180,
        lineHeightFactor: 1.5
      });
      
      // Add page number
      doc.setFontSize(8);
      doc.text(`Page ${doc.getNumberOfPages()}`, 105, 290, { align: 'center' });
    }
    
    // Create a report record in the database
    await storage.createReport({
      userId: req.user?.id || 1, // Default to admin user if not authenticated
      title: options.reportTitle || 'Comparative Market Analysis',
      type: 'CMA',
      propertyId: subjectPropertyId,
      format: options.reportFormat,
      properties: JSON.stringify({
        subjectProperty,
        comps: compIds,
        options
      })
    });
    
    // Send the PDF as response
    const pdfOutput = doc.output('arraybuffer');
    res.contentType('application/pdf');
    res.send(Buffer.from(pdfOutput));
    
    log('CMA report generated successfully', 'cma-reports');
  } catch (error: any) {
    log(`Error generating CMA report: ${error.message}`, 'cma-reports');
    res.status(500).json({ 
      message: 'Failed to generate CMA report', 
      error: error.message 
    });
  }
});

// Get list of saved CMA reports for a user
router.get('/cma-reports', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const reports = await storage.getReportsByUser(userId);
    const cmaReports = reports.filter(report => report.type === 'CMA');
    
    res.json(cmaReports);
  } catch (error: any) {
    log(`Error fetching CMA reports: ${error.message}`, 'cma-reports');
    res.status(500).json({ 
      message: 'Failed to fetch CMA reports', 
      error: error.message 
    });
  }
});

// Get a specific CMA report
router.get('/cma-reports/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = await storage.getReport(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (report.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(report);
  } catch (error: any) {
    log(`Error fetching CMA report: ${error.message}`, 'cma-reports');
    res.status(500).json({ 
      message: 'Failed to fetch CMA report', 
      error: error.message 
    });
  }
});

// Delete a CMA report
router.delete('/cma-reports/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = await storage.getReport(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (report.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const success = await storage.deleteReport(reportId);
    
    if (success) {
      res.json({ message: 'Report deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete report' });
    }
  } catch (error: any) {
    log(`Error deleting CMA report: ${error.message}`, 'cma-reports');
    res.status(500).json({ 
      message: 'Failed to delete CMA report', 
      error: error.message 
    });
  }
});

export default router;