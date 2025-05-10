import { useState, useEffect } from "react";

interface PropertyImagesProps {
  images: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood?: string;
}

const PropertyImages = ({ images, address, city, state, zipCode, neighborhood }: PropertyImagesProps) => {
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [validImages, setValidImages] = useState<string[]>([]);

  // Process images when they change
  useEffect(() => {
    // Filter out any null, undefined, or empty images
    const filtered = Array.isArray(images) 
      ? images.filter(img => img && typeof img === 'string' && img.trim() !== '') 
      : [];
    
    setValidImages(filtered);
    
    // Set the main image to the first valid image
    if (filtered.length > 0) {
      setMainImage(filtered[0]);
    } else {
      setMainImage(null);
    }
  }, [images]);

  if (!validImages || validImages.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-lg" style={{ height: "360px" }}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-text-secondary">No images available</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg" style={{ height: "360px" }}>
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={`${address} main view`} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // If image fails to load, try the next one
              const currentIndex = validImages.indexOf(mainImage);
              if (currentIndex < validImages.length - 1) {
                setMainImage(validImages[currentIndex + 1]);
              } else {
                // No more images to try
                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                e.currentTarget.className = 'w-full h-full object-contain p-8 bg-gray-100';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">Image not available</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-4">
          <h3 className="text-xl font-semibold">{address}</h3>
          <p>{neighborhood ? `${neighborhood}, ` : ''}{city}, {state} {zipCode}</p>
        </div>
      </div>
      
      {validImages.length > 1 && (
        <div className="mt-4 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 carousel" style={{ width: "max-content" }}>
            {validImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Property view ${index + 1}`}
                className={`h-20 w-28 object-cover rounded cursor-pointer transition-opacity duration-200 ${
                  image === mainImage ? 'ring-2 ring-accent' : 'hover:opacity-80'
                }`}
                onClick={() => setMainImage(image)}
                onError={(e) => {
                  // If thumbnail fails to load, hide it
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyImages;
