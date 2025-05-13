import OpenAI from "openai";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Property } from "@shared/schema";

// Create OpenAI client - ensure correct API key is used
// Do not use Perplexity API key for OpenAI services
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate a property image using DALL-E based on property details
 */
export async function generatePropertyImage(property: Property): Promise<string | null> {
  try {
    // Get property details to build the prompt
    const { bedrooms, bathrooms, squareFeet, propertyType, yearBuilt, features } = property;
    
    // Create a detailed prompt for the image generation
    let prompt = `A professional high-quality real estate photograph of a ${propertyType || 'home'}`;
    
    // Add bedrooms and bathrooms
    prompt += ` with ${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''} and ${bathrooms} bathroom${bathrooms !== "1" ? 's' : ''}`;
    
    // Add square footage
    if (squareFeet) {
      prompt += ` that is approximately ${Number(squareFeet).toLocaleString()} square feet`;
    }
    
    // Add year built if available
    if (yearBuilt) {
      prompt += ` built in ${yearBuilt}`;
    }
    
    // Add features if available
    if (features && Array.isArray(features) && features.length > 0) {
      const topFeatures = features.slice(0, 3);
      prompt += `. Features include ${topFeatures.join(", ")}`;
    }
    
    // Add quality descriptors
    prompt += `. The image should be well-lit, professional real estate photography, showing the exterior of the property from a flattering angle. Photorealistic, high quality.`;

    console.log(`Generating image for property #${property.id} with prompt: ${prompt}`);

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data returned from OpenAI");
    }

    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    // Download the image and save it locally
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // Create a unique filename
    const filename = `property_${property.id}_${uuidv4()}.png`;
    const filePath = path.join(uploadsDir, filename);
    
    // Save the image to disk
    fs.writeFileSync(filePath, buffer);
    
    // Return the path to the saved image (relative to the server)
    return `/uploads/${filename}`;
  } catch (error) {
    console.error(`Error generating property image:`, error);
    return null;
  }
}

/**
 * Generate images for multiple properties
 */
export async function generatePropertyImages(properties: Property[]): Promise<Record<number, string>> {
  const results: Record<number, string> = {};
  
  // Process properties sequentially to avoid rate limiting
  for (const property of properties) {
    try {
      const imagePath = await generatePropertyImage(property);
      if (imagePath) {
        results[property.id] = imagePath;
      }
    } catch (error) {
      console.error(`Error generating image for property ${property.id}:`, error);
    }
  }
  
  return results;
}

/**
 * Update a property with the generated image
 */
export async function updatePropertyWithGeneratedImage(property: Property, storage: any): Promise<Property | null> {
  try {
    const imagePath = await generatePropertyImage(property);
    
    if (!imagePath) {
      return null;
    }
    
    // Get existing images
    const existingImages = property.images 
      ? (typeof property.images === 'string' 
          ? JSON.parse(property.images) 
          : property.images) 
      : [];
    
    // Combine existing images with the new one
    const updatedImages = [...existingImages, imagePath];
    
    // Update the property with the new image
    const updatedProperty = await storage.updateProperty(property.id, { 
      images: updatedImages
    });
    
    return updatedProperty;
  } catch (error) {
    console.error(`Error updating property with generated image:`, error);
    return null;
  }
}