import express from 'express';
// import { storage } from '../storage';
import { z } from 'zod';
import { insertPropertySchema } from '@shared/schema';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Use mock data instead of database
import mockProperties from '../mocks/properties.json';

// Create a mock storage object to replace the actual storage
const storage = {
  getAllProperties: async () => mockProperties,
  getPropertiesByFilters: async () => mockProperties,
  getProperty: async (id: number) => mockProperties.find(p => p.id === id),
  createProperty: async (data: any) => ({ ...data, id: Math.max(...mockProperties.map(p => p.id)) + 1 }),
  updateProperty: async (id: number, data: any) => {
    const property = mockProperties.find(p => p.id === id);
    return { ...property, ...data };
  },
  getPropertyHistory: async () => []
};

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
    let properties = [...mockProperties];
    
    // Check if filters are provided
    if (Object.keys(req.query).length > 0) {
      const filters = req.query;
      
      // Apply basic filtering - this is simplified
      if (filters.location) {
        const location = (filters.location as string).toLowerCase();
        properties = properties.filter(p => 
          p.city.toLowerCase().includes(location) || 
          p.state.toLowerCase().includes(location) ||
          p.neighborhood?.toLowerCase().includes(location)
        );
      }
      
      if (filters.propertyType) {
        properties = properties.filter(p => 
          p.property_type === filters.propertyType
        );
      }
      
      if (filters.minPrice) {
        const minPrice = parseInt(filters.minPrice as string);
        properties = properties.filter(p => p.price >= minPrice);
      }
      
      if (filters.maxPrice) {
        const maxPrice = parseInt(filters.maxPrice as string);
        properties = properties.filter(p => p.price <= maxPrice);
      }
      
      if (filters.minBeds) {
        const minBeds = parseInt(filters.minBeds as string);
        properties = properties.filter(p => p.bedrooms >= minBeds);
      }
      
      if (filters.status) {
        properties = properties.filter(p => 
          p.status === filters.status
        );
      }
    }
    
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Search properties (before the /:id route to avoid conflicts)
router.get('/search', async (req, res) => {
  try {
    let properties = [...mockProperties];
    
    // Filter properties based on query parameters
    if (req.query.city || req.query.location) {
      const location = ((req.query.city || req.query.location) as string).toLowerCase();
      properties = properties.filter(p => 
        p.city?.toLowerCase().includes(location) || 
        p.state?.toLowerCase().includes(location) ||
        p.neighborhood?.toLowerCase().includes(location)
      );
    }
    
    if (req.query.propertyType) {
      properties = properties.filter(p => 
        p.property_type === req.query.propertyType
      );
    }
    
    if (req.query.minPrice) {
      const minPrice = parseInt(req.query.minPrice as string);
      properties = properties.filter(p => p.price >= minPrice);
    }
    
    if (req.query.maxPrice) {
      const maxPrice = parseInt(req.query.maxPrice as string);
      properties = properties.filter(p => p.price <= maxPrice);
    }
    
    if (req.query.minBeds) {
      const minBeds = parseInt(req.query.minBeds as string);
      properties = properties.filter(p => p.bedrooms >= minBeds);
    }
    
    if (req.query.minBaths) {
      const minBaths = parseFloat(req.query.minBaths as string);
      properties = properties.filter(p => p.bathrooms >= minBaths);
    }
    
    if (req.query.status) {
      properties = properties.filter(p => 
        p.status === req.query.status
      );
    }
    
    if (req.query.zipCode) {
      properties = properties.filter(p => 
        p.zip_code === req.query.zipCode
      );
    }
    
    res.json(properties);
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ 
      message: 'Failed to search properties', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get a specific property
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Use mock data
    const property = mockProperties.find(p => p.id === id);
    
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
    
    // Create property (in-memory only)
    const newProperty = {
      ...validatedProperty,
      id: mockProperties.length > 0 ? Math.max(...mockProperties.map(p => p.id)) + 1 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // In a real implementation, we would add to the database here
    // For the mock version, we don't persist the data
    
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
    
    // Check if property exists in mock data
    const existingPropertyIndex = mockProperties.findIndex(p => p.id === id);
    if (existingPropertyIndex === -1) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Update property (in-memory only)
    const updatedProperty = {
      ...mockProperties[existingPropertyIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    // In a real implementation, we would update the database here
    // For the mock version, we don't persist the data
    
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
    
    // Check if property exists in mock data
    const propertyIndex = mockProperties.findIndex(p => p.id === propertyId);
    if (propertyIndex === -1) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Get uploaded files
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    // Create image file paths
    const imagePaths = files.map(file => `/uploads/${file.filename}`);
    
    // In a real implementation, we would update the database here
    // For the mock version, we just return success
    
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