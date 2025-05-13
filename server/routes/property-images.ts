import express from "express";
import { storage } from "../storage";
import { Property } from "@shared/schema";
import { generatePropertyImage, generatePropertyImages } from "../services/imageGenerationService";

const router = express.Router();

// Generate an image for a specific property
router.post("/:id/generate", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ success: false, message: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    
    // Generate image using DALL-E
    const imageUrl = await generatePropertyImage(property);
    
    if (!imageUrl) {
      return res.status(500).json({ success: false, message: "Failed to generate image" });
    }
    
    // Save the property with the new image
    if (property.images) {
      // If property already has images, add the new one
      const images = Array.isArray(property.images) 
        ? [...property.images, imageUrl] 
        : typeof property.images === 'object' 
          ? [...Object.values(property.images), imageUrl] 
          : [imageUrl];
          
      property.images = images;
    } else {
      // If no images, create a new array
      property.images = [imageUrl];
    }
    
    // Update main image URL if none exists
    if (!property.mainImageUrl) {
      property.mainImageUrl = imageUrl;
    }
    
    // Save the updated property
    await storage.updateProperty(propertyId, property);
    
    res.json({ 
      success: true, 
      message: "Image generated successfully", 
      imageUrl 
    });
  } catch (error) {
    console.error("Error generating property image:", error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
});

// Generate images for all properties that don't have images
router.post("/generate-all", async (req, res) => {
  try {
    // Get all properties without images
    const allProperties = await storage.getAllProperties();
    
    const propertiesWithoutImages = allProperties.filter(property => {
      if (!property.images) return true;
      
      if (Array.isArray(property.images) && property.images.length === 0) return true;
      
      if (typeof property.images === 'object' && Object.keys(property.images).length === 0) return true;
      
      return false;
    });
    
    if (propertiesWithoutImages.length === 0) {
      return res.json({ 
        success: true, 
        message: "All properties already have images" 
      });
    }
    
    // Limit to first 5 properties to avoid rate limiting issues
    const propertiesToProcess = propertiesWithoutImages.slice(0, 5);
    
    // Start the image generation process in the background
    setTimeout(async () => {
      try {
        const generatedImages = await generatePropertyImages(propertiesToProcess);
        
        // Update properties with generated images
        for (const [propertyId, imageUrl] of Object.entries(generatedImages)) {
          const property = await storage.getProperty(parseInt(propertyId));
          
          if (property) {
            // Add new image to property
            if (property.images) {
              const images = Array.isArray(property.images) 
                ? [...property.images, imageUrl] 
                : typeof property.images === 'object' 
                  ? [...Object.values(property.images), imageUrl] 
                  : [imageUrl];
                  
              property.images = images;
            } else {
              property.images = [imageUrl];
            }
            
            // Update main image URL if none exists
            if (!property.mainImageUrl) {
              property.mainImageUrl = imageUrl;
            }
            
            // Save the updated property
            await storage.updateProperty(parseInt(propertyId), property);
          }
        }
        
        console.log(`Generated images for ${Object.keys(generatedImages).length} properties`);
      } catch (error) {
        console.error("Error in background image generation:", error);
      }
    }, 100);
    
    res.json({ 
      success: true, 
      message: `Started generating images for ${propertiesToProcess.length} properties. This process will continue in the background.` 
    });
  } catch (error) {
    console.error("Error generating property images:", error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
});

export default router;