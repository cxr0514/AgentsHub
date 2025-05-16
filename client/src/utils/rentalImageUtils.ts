// Utility function to provide realistic rental property images based on property characteristics

/**
 * A collection of high-quality rental property images organized by property type
 */
export const rentalPropertyImages = {
  apartment: [
    'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594484208280-efa00f96fc21?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628744448839-a475c67cbd93?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1619994948958-1e3e1ab8cdee?q=80&w=800&auto=format&fit=crop'
  ],
  condo: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop'
  ],
  house: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598228723793-52759bba239c?q=80&w=800&auto=format&fit=crop'
  ],
  townhouse: [
    'https://images.unsplash.com/photo-1580216643062-cf460548a66a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1625602812206-5ec545ca1231?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=800&auto=format&fit=crop'
  ]
};

/**
 * Returns a consistent image URL for a property based on its characteristics
 * 
 * @param propertyType The type of property (apartment, condo, house, etc.)
 * @param propertyId The unique ID of the property (used to deterministically select an image)
 * @returns URL to an appropriate property image
 */
export function getPropertyImage(propertyType: string, propertyId: number): string {
  // Normalize property type to match our image categories
  let normalizedType = propertyType.toLowerCase();
  
  // Map various property types to our image categories
  if (normalizedType.includes('apt') || normalizedType.includes('flat')) {
    normalizedType = 'apartment';
  } else if (normalizedType.includes('condo')) {
    normalizedType = 'condo';
  } else if (normalizedType.includes('town') || normalizedType.includes('row')) {
    normalizedType = 'townhouse';
  } else if (normalizedType.includes('single') || normalizedType.includes('detached') || normalizedType.includes('family')) {
    normalizedType = 'house';
  } else {
    // Default to apartment if type can't be determined
    normalizedType = 'apartment';
  }
  
  // Get the appropriate image array
  const imageArray = rentalPropertyImages[normalizedType as keyof typeof rentalPropertyImages] || rentalPropertyImages.apartment;
  
  // Use property ID to deterministically select an image
  const imageIndex = propertyId % imageArray.length;
  
  return imageArray[imageIndex];
}

/**
 * Generate multiple property images for a single property
 * 
 * @param propertyType The type of property
 * @param propertyId The unique ID of the property
 * @param count Number of images to generate
 * @returns Array of image URLs
 */
export function getPropertyImages(propertyType: string, propertyId: number, count: number = 3): string[] {
  // Get the main image
  const mainImage = getPropertyImage(propertyType, propertyId);
  
  if (count <= 1) {
    return [mainImage];
  }
  
  // For additional images, we'll use variations based on the property ID
  const images = [mainImage];
  
  // Normalize property type
  let normalizedType = propertyType.toLowerCase();
  if (normalizedType.includes('apt') || normalizedType.includes('flat')) {
    normalizedType = 'apartment';
  } else if (normalizedType.includes('condo')) {
    normalizedType = 'condo';
  } else if (normalizedType.includes('town') || normalizedType.includes('row')) {
    normalizedType = 'townhouse';
  } else if (normalizedType.includes('single') || normalizedType.includes('detached') || normalizedType.includes('family')) {
    normalizedType = 'house';
  } else {
    normalizedType = 'apartment';
  }
  
  const imageArray = rentalPropertyImages[normalizedType as keyof typeof rentalPropertyImages] || rentalPropertyImages.apartment;
  
  // Add additional images
  for (let i = 1; i < count; i++) {
    const imageIndex = (propertyId + i) % imageArray.length;
    images.push(imageArray[imageIndex]);
  }
  
  return images;
}