import { useState } from "react";

interface PropertyImagesProps {
  images: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood?: string;
}

const PropertyImages = ({ images, address, city, state, zipCode, neighborhood }: PropertyImagesProps) => {
  const [mainImage, setMainImage] = useState(images[0]);

  if (!images || images.length === 0) {
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
        <img 
          src={mainImage} 
          alt={`${address} main view`} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-4">
          <h3 className="text-xl font-semibold">{address}</h3>
          <p>{neighborhood ? `${neighborhood}, ` : ''}{city}, {state} {zipCode}</p>
        </div>
      </div>
      
      <div className="mt-4 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 carousel" style={{ width: "max-content" }}>
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Property view ${index + 1}`}
              className={`h-20 w-28 object-cover rounded cursor-pointer transition-opacity duration-200 ${
                image === mainImage ? 'ring-2 ring-accent' : 'hover:opacity-80'
              }`}
              onClick={() => setMainImage(image)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default PropertyImages;
