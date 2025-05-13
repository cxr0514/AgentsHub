import { Router } from "express";
import { storage } from "../storage";
import { 
  generatePropertyImage, 
  updatePropertyWithGeneratedImage 
} from "../services/imageGenerationService";

const router = Router();

// Generate an image for a specific property
router.post('/:id/generate', async (req, res) => {
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
    
    // Update the property with a generated image
    const updatedProperty = await updatePropertyWithGeneratedImage(property, storage);
    
    if (!updatedProperty) {
      return res.status(500).json({ message: 'Failed to generate property image' });
    }
    
    res.json({ 
      success: true, 
      property: updatedProperty,
      message: 'Property image generated successfully'
    });
  } catch (error) {
    console.error('Error generating property image:', error);
    res.status(500).json({ 
      message: 'Failed to generate property image', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Generate images for all properties without images
router.post('/generate-all', async (req, res) => {
  try {
    // Get all properties that don't have images
    const properties = await storage.getAllProperties();
    const propertiesWithoutImages = properties.filter(p => {
      // Check if the property has no images or empty images array
      return !p.images || 
        (typeof p.images === 'string' && (p.images === '[]' || p.images === '')) ||
        (Array.isArray(p.images) && p.images.length === 0);
    });
    
    if (propertiesWithoutImages.length === 0) {
      return res.json({ 
        message: 'No properties found without images',
        count: 0
      });
    }
    
    // Start the image generation process
    res.json({ 
      message: `Started generating images for ${propertiesWithoutImages.length} properties. This may take some time.`,
      count: propertiesWithoutImages.length
    });
    
    // Process properties asynchronously (don't wait for response)
    (async () => {
      let successCount = 0;
      let errorCount = 0;
      
      for (const property of propertiesWithoutImages) {
        try {
          const updatedProperty = await updatePropertyWithGeneratedImage(property, storage);
          if (updatedProperty) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error generating image for property ${property.id}:`, error);
          errorCount++;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Image generation complete: ${successCount} successes, ${errorCount} errors`);
    })();
    
  } catch (error) {
    console.error('Error generating property images:', error);
    res.status(500).json({ 
      message: 'Failed to generate property images', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;