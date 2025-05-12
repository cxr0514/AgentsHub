import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertPropertySchema } from '@shared/schema';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for multer
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const extension = path.extname(file.originalname);
    const filename = `${uuidv4()}${extension}`;
    cb(null, filename);
  }
});

// Configure file filter to only accept images
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Get all properties
router.get('/', async (req, res) => {
  try {
    let properties;
    
    // Check if filters are provided
    if (Object.keys(req.query).length > 0) {
      properties = await storage.getPropertiesByFilters(req.query);
    } else {
      properties = await storage.getAllProperties();
    }
    
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get a specific property
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create a new property
router.post('/', async (req, res) => {
  try {
    // Validate property data
    const validatedProperty = insertPropertySchema.parse(req.body);
    
    // Create property
    const newProperty = await storage.createProperty(validatedProperty);
    
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid property data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create property', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update a property
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Check if property exists
    const existingProperty = await storage.getProperty(id);
    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Update property
    const updatedProperty = await storage.updateProperty(id, req.body);
    
    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid property data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update property', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Upload images for a property
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Check if property exists
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Get uploaded files
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    // Create image file paths
    const imagePaths = files.map(file => `/uploads/${file.filename}`);
    
    // Update property with image paths
    const currentImages = property.images ? 
      (typeof property.images === 'string' ? 
        JSON.parse(property.images) : property.images) as string[] : 
      [];
      
    const updatedImages = [...currentImages, ...imagePaths];
    
    await storage.updateProperty(propertyId, { images: updatedImages });
    
    res.status(200).json({ 
      message: 'Images uploaded successfully', 
      images: imagePaths,
      propertyId
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Failed to upload images', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;