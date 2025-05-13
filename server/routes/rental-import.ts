import { Router } from 'express';
import { importZillowRentals, countRentalProperties } from '../services/importers/zillowRentalImporter';
import { requireAdmin } from '../middleware/permissions';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { log } from '../vite';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only JSON files
    if (path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB size limit
  }
});

// Route to check rental properties count
router.get('/properties/count', async (req, res) => {
  try {
    const count = await countRentalProperties();
    res.json({ count });
  } catch (error) {
    log(`Error counting rental properties: ${error instanceof Error ? error.message : 'Unknown error'}`, 'import');
    res.status(500).json({ error: 'Failed to count rental properties' });
  }
});

// Route to import Zillow rental data
router.post('/properties/import', requireAdmin, upload.single('rentalData'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    log(`Processing file upload: ${filePath}`, 'import');
    
    // Import the data
    const result = await importZillowRentals(filePath);
    
    // Delete the temporary file
    fs.unlinkSync(filePath);
    
    res.json({
      message: `Successfully imported ${result.imported} rental properties with ${result.errors} errors`,
      imported: result.imported,
      errors: result.errors
    });
    
  } catch (error) {
    log(`Error importing rental properties: ${error instanceof Error ? error.message : 'Unknown error'}`, 'import');
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to import rental properties',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route to import from an existing file in the system
router.post('/properties/import-file', requireAdmin, async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'No file path provided' });
    }
    
    // Verify the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }
    
    // Import the data
    const result = await importZillowRentals(filePath);
    
    res.json({
      message: `Successfully imported ${result.imported} rental properties with ${result.errors} errors`,
      imported: result.imported,
      errors: result.errors
    });
    
  } catch (error) {
    log(`Error importing rental properties: ${error instanceof Error ? error.message : 'Unknown error'}`, 'import');
    res.status(500).json({ 
      error: 'Failed to import rental properties',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route to import the sample data from the attached_assets folder
router.post('/properties/import-sample', requireAdmin, async (req, res) => {
  try {
    const sampleFile = path.join(process.cwd(), 'attached_assets/Outscraper-20250513184410s1c.json');
    
    // Verify the file exists
    if (!fs.existsSync(sampleFile)) {
      return res.status(404).json({ error: `Sample file not found: ${sampleFile}` });
    }
    
    log(`Importing sample data from ${sampleFile}`, 'import');
    
    // Import the data
    const result = await importZillowRentals(sampleFile);
    
    res.json({
      message: `Successfully imported ${result.imported} rental properties with ${result.errors} errors`,
      imported: result.imported,
      errors: result.errors
    });
    
  } catch (error) {
    log(`Error importing sample rental properties: ${error instanceof Error ? error.message : 'Unknown error'}`, 'import');
    res.status(500).json({ 
      error: 'Failed to import sample rental properties',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;