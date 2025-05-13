import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { log } from '../vite';
import { createPdfDocument, hexToRgb, formatCurrency, formatNumber } from '../services/pdfService';

/**
 * Fixed CMA Report Generator
 * 
 * This module provides routes for generating Comparative Market Analysis (CMA) reports
 * with proper jsPDF and autoTable integration using our PDF service for better reliability.
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
    log('Generating fixed CMA report', 'cma-reports');
    
    // Create PDF document using our service
    const doc = await createPdfDocument();
    
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
      subjectProperty.zipCode || ''
    );
    
    // Set up font and colors
    const primaryColor = options.brandingColor || '#071224';
    const [r, g, b] = hexToRgb(primaryColor);
    doc.setDrawColor(r, g, b);
    doc.setFillColor(r, g, b);
    
    // Process logo if uploaded
    let logoPath = '';
    if (req.file) {
      logoPath = req.file.filename;
      const logoFile = path.join(uploadDir, logoPath);
      if (fs.existsSync(logoFile)) {
        try {
          // Add logo to the PDF - 40mm wide, maintain aspect ratio
          doc.addImage(logoFile, 'JPEG', 10, 10, 40, 20);
        } catch (err) {
          log(`Warning: Could not add logo: ${err}`, 'cma-reports');
          // Continue without the logo
        }
      }
    }
    
    // Cover page
    if (options.includeCoverPage !== false) {
      // Page title
      doc.setFontSize(24);
      doc.setTextColor(r, g, b);
      doc.text('Comparative Market Analysis', 105, 50, { align: 'center' });
      
      // Property address
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`${subjectProperty.address}`, 105, 70, { align: 'center' });
      doc.text(`${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`, 105, 80, { align: 'center' });
      
      // Report date
      const today = new Date();
      doc.setFontSize(12);
      doc.text(`Prepared on ${today.toLocaleDateString()}`, 105, 100, { align: 'center' });
      
      // Agent info
      if (options.agentName) {
        doc.text(`Prepared by: ${options.agentName}`, 105, 110, { align: 'center' });
        
        if (options.agentEmail) {
          doc.text(`${options.agentEmail}`, 105, 120, { align: 'center' });
        }
        
        if (options.agentPhone) {
          doc.text(`${options.agentPhone}`, 105, 130, { align: 'center' });
        }
      }
      
      // Client info
      if (options.clientName) {
        doc.text(`Prepared for: ${options.clientName}`, 105, 150, { align: 'center' });
        
        if (options.clientEmail) {
          doc.text(`${options.clientEmail}`, 105, 160, { align: 'center' });
        }
      }
      
      // Add a new page for the content
      doc.addPage();
    }
    
    // Table of contents
    doc.setFontSize(20);
    doc.setTextColor(r, g, b);
    doc.text('Table of Contents', 14, 20);
    doc.setDrawColor(r, g, b);
    doc.line(14, 25, 196, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let tocY = 40;
    let pageNumber = 2; // Start at 2 because of cover and TOC
    
    // Add TOC entries
    doc.text('1. Subject Property Details', 20, tocY);
    doc.text(`Page ${pageNumber++}`, 180, tocY, { align: 'right' });
    tocY += 10;
    
    if (options.includeComps !== false) {
      doc.text('2. Comparable Properties', 20, tocY);
      doc.text(`Page ${pageNumber++}`, 180, tocY, { align: 'right' });
      tocY += 10;
    }
    
    if (options.includeAdjustments !== false) {
      doc.text('3. Price Adjustments Analysis', 20, tocY);
      doc.text(`Page ${pageNumber++}`, 180, tocY, { align: 'right' });
      tocY += 10;
    }
    
    if (options.includeMarketAnalysis !== false && marketData && marketData.length > 0) {
      doc.text('4. Local Market Analysis', 20, tocY);
      doc.text(`Page ${pageNumber++}`, 180, tocY, { align: 'right' });
      tocY += 10;
    }
    
    // Add a new page for subject property
    doc.addPage();
    
    // Subject property details
    doc.setFontSize(20);
    doc.setTextColor(r, g, b);
    doc.text('Subject Property Details', 14, 20);
    doc.line(14, 25, 196, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Property details as a table
    const subjectPropertyData = [
      ['Address', `${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}`],
      ['Price', `$${Number(subjectProperty.price).toLocaleString()}`],
      ['Bedrooms', `${subjectProperty.bedrooms}`],
      ['Bathrooms', `${subjectProperty.bathrooms}`],
      ['Square Feet', `${Number(subjectProperty.squareFeet).toLocaleString()}`],
      ['Price/Sq.Ft', `$${(Number(subjectProperty.price) / Number(subjectProperty.squareFeet)).toFixed(2)}`],
      ['Year Built', `${subjectProperty.yearBuilt || 'N/A'}`],
      ['Property Type', `${subjectProperty.propertyType}`],
      ['Lot Size', `${subjectProperty.lotSize || 'N/A'}`],
      ['Status', `${subjectProperty.status || 'N/A'}`]
    ];
    
    // Use autoTable to create a clean table
    doc.autoTable({
      startY: 35,
      head: [['Property Attribute', 'Details']],
      body: subjectPropertyData,
      theme: 'grid',
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      margin: { top: 35 }
    });
    
    // Add comparable properties
    if (options.includeComps !== false) {
      doc.addPage();
      doc.setFontSize(20);
      doc.setTextColor(r, g, b);
      doc.text('Comparable Properties', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      // Prepare data for the comparison table
      const compData = comps.map(comp => [
        comp.address,
        `$${Number(comp.price).toLocaleString()}`,
        `${Number(comp.squareFeet).toLocaleString()}`,
        `${comp.bedrooms}`,
        `${comp.bathrooms}`,
        comp.yearBuilt ? `${comp.yearBuilt}` : 'N/A',
        `$${(Number(comp.price) / Number(comp.squareFeet)).toFixed(2)}`,
        comp.status || 'N/A'
      ]);
      
      // Use autoTable to create the comparison table
      doc.autoTable({
        startY: 35,
        head: [['Address', 'Price', 'Sq.Ft', 'Beds', 'Baths', 'Year', 'Price/Sqft', 'Status']],
        body: compData,
        theme: 'grid',
        headStyles: {
          fillColor: [r, g, b],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 40 }
        },
        margin: { top: 35 }
      });
    }
    
    // Add price adjustments
    if (options.includeAdjustments !== false) {
      doc.addPage();
      doc.setFontSize(20);
      doc.setTextColor(r, g, b);
      doc.text('Price Adjustments Analysis', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      doc.text('Adjustments are made to comparable properties to account for differences with the subject property.', 14, 35);
      
      // Per-property adjustments
      let yPos = 50;
      
      for (const comp of comps) {
        // If not enough room on the page, add a new page
        if (yPos > 240) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(r, g, b);
        doc.text(`Adjustments for ${comp.address}`, 14, yPos);
        yPos += 10;
        
        // Calculate adjustments
        const sqftDiff = Math.round(Number(subjectProperty.squareFeet) - Number(comp.squareFeet));
        const sqftAdjustment = sqftDiff * 100; // $100 per sq ft difference
        
        const bedDiff = Number(subjectProperty.bedrooms) - Number(comp.bedrooms);
        const bedAdjustment = bedDiff * 5000; // $5000 per bedroom difference
        
        const bathDiff = Number(subjectProperty.bathrooms) - Number(comp.bathrooms);
        const bathAdjustment = bathDiff * 7500; // $7500 per bathroom difference
        
        let yearAdjustment = 0;
        if (subjectProperty.yearBuilt && comp.yearBuilt) {
          const yearDiff = Number(subjectProperty.yearBuilt) - Number(comp.yearBuilt);
          yearAdjustment = yearDiff * 1000; // $1000 per year difference
        }
        
        const totalAdjustment = sqftAdjustment + bedAdjustment + bathAdjustment + yearAdjustment;
        const adjustedValue = Number(comp.price) + totalAdjustment;
        
        // Create adjustment table
        const adjustmentRows = [
          ['Square Footage', `${Number(comp.squareFeet).toLocaleString()} sf`, `${Number(subjectProperty.squareFeet).toLocaleString()} sf`, `${sqftAdjustment >= 0 ? '+' : ''}$${Math.abs(sqftAdjustment).toLocaleString()}`],
          ['Bedrooms', `${comp.bedrooms}`, `${subjectProperty.bedrooms}`, `${bedAdjustment >= 0 ? '+' : ''}$${Math.abs(bedAdjustment).toLocaleString()}`],
          ['Bathrooms', `${comp.bathrooms}`, `${subjectProperty.bathrooms}`, `${bathAdjustment >= 0 ? '+' : ''}$${Math.abs(bathAdjustment).toLocaleString()}`]
        ];
        
        if (subjectProperty.yearBuilt && comp.yearBuilt) {
          adjustmentRows.push(['Year Built', `${comp.yearBuilt}`, `${subjectProperty.yearBuilt}`, `${yearAdjustment >= 0 ? '+' : ''}$${Math.abs(yearAdjustment).toLocaleString()}`]);
        }
        
        adjustmentRows.push(
          ['Total Adjustment', '', '', `${totalAdjustment >= 0 ? '+' : ''}$${Math.abs(totalAdjustment).toLocaleString()}`],
          ['Original Value', '', '', `$${Number(comp.price).toLocaleString()}`],
          ['Adjusted Value', '', '', `$${adjustedValue.toLocaleString()}`]
        );
        
        // Use autoTable for adjustments
        doc.autoTable({
          startY: yPos,
          head: [['Feature', 'Comparable', 'Subject Property', 'Adjustment']],
          body: adjustmentRows,
          theme: 'grid',
          headStyles: {
            fillColor: [r, g, b],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          columnStyles: {
            3: { halign: 'right' }
          },
          margin: { left: 14, right: 14 }
        });
        
        yPos = doc.lastAutoTable.finalY + 20;
      }
    }
    
    // Add market analysis if there's market data available
    if (options.includeMarketAnalysis !== false && marketData && marketData.length > 0) {
      doc.addPage();
      doc.setFontSize(20);
      doc.setTextColor(r, g, b);
      doc.text('Local Market Analysis', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      // Sort market data by date (newest first)
      const sortedMarketData = [...marketData].sort((a, b) => {
        if (!a.year || !b.year) return 0;
        // If years are different, sort by year
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        // If months are different, sort by month
        if (!a.month || !b.month) return 0;
        return b.month - a.month;
      });
      
      // Limit to the 12 most recent data points
      const recentMarketData = sortedMarketData.slice(0, 12);
      
      // Market data table
      const marketDataRows = recentMarketData.map(data => {
        const month = data.month || 0;
        const year = data.year || 0;
        return [
          `${month}/${year}`,
          `$${Number(data.medianPrice).toLocaleString()}`,
          data.daysOnMarket ? `${data.daysOnMarket}` : 'N/A',
          data.averagePricePerSqft ? `$${data.averagePricePerSqft.toFixed(2)}` : 'N/A'
        ];
      });
      
      doc.autoTable({
        startY: 35,
        head: [['Period', 'Median Price', 'Days on Market', 'Avg Price/Sqft']],
        body: marketDataRows,
        theme: 'grid',
        headStyles: {
          fillColor: [r, g, b],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9
        },
        margin: { top: 35 }
      });
      
      // Market trends summary
      const latestData = recentMarketData[0];
      const sixMonthsAgo = recentMarketData.length > 5 ? recentMarketData[5] : null;
      
      if (latestData && sixMonthsAgo) {
        const priceChange = ((Number(latestData.medianPrice) - Number(sixMonthsAgo.medianPrice)) / Number(sixMonthsAgo.medianPrice)) * 100;
        
        doc.setFontSize(14);
        doc.text('6-Month Market Trends Summary', 14, doc.lastAutoTable.finalY + 20);
        
        doc.setFontSize(12);
        doc.text(`• Median home prices have ${priceChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(1)}% in the last 6 months.`, 20, doc.lastAutoTable.finalY + 30);
        
        if (latestData.daysOnMarket && sixMonthsAgo.daysOnMarket) {
          const domChange = latestData.daysOnMarket - sixMonthsAgo.daysOnMarket;
          doc.text(`• Days on market has ${domChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(domChange)} days.`, 20, doc.lastAutoTable.finalY + 40);
        }
      }
    }
    
    // Add notes if provided
    if (options.notes) {
      doc.addPage();
      doc.setFontSize(20);
      doc.setTextColor(r, g, b);
      doc.text('Notes', 14, 20);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
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
    fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
    
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
    
    // Return success response with additional data
    return res.status(200).json({
      message: 'CMA report generated successfully',
      reportId: report.id,
      fileName: fileName,
      downloadUrl: `/api/reports/download/${report.id}`,
      pageCount: pageCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    const error = err as Error;
    log(`Error generating fixed CMA report: ${error.message}`, 'cma-reports');
    console.error('Full error:', error);
    return res.status(500).json({ 
      message: `Failed to generate CMA report: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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