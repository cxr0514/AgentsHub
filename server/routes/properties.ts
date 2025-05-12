import express from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertPropertySchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Set up storage for uploaded images
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const imagesDir = path.join(uploadDir, "property-images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (ext && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  }
});

// Get all properties
router.get("/", async (req, res) => {
  try {
    const properties = await storage.getAllProperties();
    res.json(properties);
  } catch (error) {
    console.error("Error getting properties:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
});

// Get a single property
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const property = await storage.getProperty(id);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    res.json(property);
  } catch (error) {
    console.error("Error getting property:", error);
    res.status(500).json({ message: "Failed to fetch property" });
  }
});

// Create a new property
router.post("/", async (req, res) => {
  try {
    // Validate the request body
    const validatedData = insertPropertySchema.parse(req.body);
    
    // Create the property
    const property = await storage.createProperty(validatedData);
    res.status(201).json(property);
  } catch (error) {
    console.error("Error creating property:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid property data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create property" });
  }
});

// Update a property
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const property = await storage.updateProperty(id, req.body);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    res.json(property);
  } catch (error) {
    console.error("Error updating property:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid property data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update property" });
  }
});

// Upload property images
router.post("/:id/images", upload.array("images", 10), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const property = await storage.getProperty(id);
    
    if (!property) {
      // Clean up uploaded files if property doesn't exist
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({ message: "Property not found" });
    }
    
    // Get current images or initialize as empty array
    const currentImages = property.images || [];
    
    // Add new uploaded images
    const uploadedFiles = req.files as Express.Multer.File[];
    const newImages = uploadedFiles.map(file => {
      // Create URL path for the image based on its location in the uploads folder
      const relativePath = path.relative(uploadDir, file.path);
      const imageUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
      return {
        filename: file.filename,
        originalName: file.originalname,
        path: imageUrl,
        size: file.size,
        mimetype: file.mimetype
      };
    });
    
    // Update property with new images
    const updatedImages = [...currentImages, ...newImages];
    const updatedProperty = await storage.updateProperty(id, { images: updatedImages });
    
    res.json({
      success: true,
      message: `Uploaded ${newImages.length} images`,
      images: newImages,
      property: updatedProperty
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

// Delete a property image
router.delete("/:propertyId/images/:filename", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const { filename } = req.params;
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    // Check if property has images
    if (!property.images || !Array.isArray(property.images)) {
      return res.status(404).json({ message: "Property has no images" });
    }
    
    // Find the image to delete
    const imageIndex = property.images.findIndex((img: any) => img.filename === filename);
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    // Get the image object to delete the file
    const imageToDelete = property.images[imageIndex];
    
    // Remove the image from the array
    const updatedImages = [...property.images];
    updatedImages.splice(imageIndex, 1);
    
    // Update the property with the new images array
    await storage.updateProperty(propertyId, { images: updatedImages });
    
    // Delete the file from disk
    try {
      const imagePath = path.join(imagesDir, filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (err) {
      console.error("Error deleting image file:", err);
      // Continue even if file deletion fails
    }
    
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Failed to delete image" });
  }
});

export default router;