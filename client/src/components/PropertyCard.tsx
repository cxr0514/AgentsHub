import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Home, Bed, Bath, Square, Image } from "lucide-react";
import { Property } from "@shared/schema";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import GeneratePropertyImageButton from "./GeneratePropertyImageButton";

interface PropertyCardProps {
  property: Property;
  onSave?: (propertyId: number) => void;
  isSaved?: boolean;
  compact?: boolean;
  onImageGenerated?: () => void;
}

const PropertyCard = ({ property, onSave, isSaved = false, compact = false, onImageGenerated }: PropertyCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  
  let images;
  try {
    // Handle both already parsed arrays and JSON strings
    images = typeof property.images === 'string' 
      ? JSON.parse(property.images) 
      : property.images;
  } catch (error) {
    console.error("Error parsing images:", error);
    images = [];
  }
  
  const mainImage = images && images.length > 0 ? images[0] : null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) {
      onSave(property.id);
    }
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className={cn(
        "overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full border border-[#0f1d31] bg-[#050e1d] text-white",
        compact ? "flex flex-row" : "flex flex-col"
      )}>
        <div className={cn(
          "relative", 
          compact ? "w-24 xs:w-28 sm:w-36 flex-shrink-0" : "w-full"
        )}>
          {mainImage ? (
            <>
              {isLoading && (
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center bg-[#071224]",
                  compact ? "h-full" : "h-36 xs:h-40 sm:h-48"
                )}>
                  <div className="animate-pulse rounded bg-[#0f1d31] w-full h-full" />
                </div>
              )}
              <img
                src={mainImage}
                alt={property.address}
                className={cn(
                  "object-cover",
                  compact ? "h-full w-full" : "h-36 xs:h-40 sm:h-48 w-full"
                )}
                onLoad={handleImageLoad}
                onError={() => setIsLoading(false)}
              />
            </>
          ) : (
            <div className={cn(
              "bg-[#071224] flex flex-col items-center justify-center",
              compact ? "h-full w-full" : "h-36 xs:h-40 sm:h-48 w-full"
            )}>
              <Home className="h-8 w-8 sm:h-12 sm:w-12 text-[#0f1d31] mb-2" />
              {!compact && (
                <div 
                  className="absolute bottom-3 left-0 right-0 flex justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <GeneratePropertyImageButton 
                    propertyId={property.id} 
                    onComplete={() => {
                      if (onImageGenerated) {
                        onImageGenerated();
                      }
                    }} 
                  />
                </div>
              )}
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "rounded-full",
                compact ? "h-6 w-6" : "h-8 w-8",
                isSaved ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              )}
              onClick={handleSaveClick}
            >
              <Bookmark className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
            </Button>
          </div>
          
          {/* Status badge added to the image on mobile */}
          <div className="absolute bottom-2 left-2 sm:hidden">
            <StatusBadge status={property.status} compact={true} />
          </div>
        </div>
        
        <CardContent className={cn(
          compact ? "p-2 xs:p-3 flex-1 min-w-0" : "p-3 sm:p-4"
        )}>
          <div className="flex justify-between mb-1 items-start">
            <div className="font-semibold text-base sm:text-lg text-[#FF7A00] line-clamp-1">
              ${Number(property.price).toLocaleString()}
            </div>
            <div className="hidden sm:block">
              <StatusBadge status={property.status} />
            </div>
          </div>

          <h3 className="font-medium text-white text-sm sm:text-base line-clamp-1">{property.address}</h3>
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}
            {property.city}, {property.state}
          </p>

          <div className={cn(
            "text-xs sm:text-sm text-slate-300 font-medium",
            compact ? "flex gap-2 mt-1" : "flex justify-between mt-2 gap-1"
          )}>
            <div className="flex items-center gap-1">
              {!compact && <Bed className="h-3 w-3 text-[#FF7A00]" />}
              <span className={cn(
                compact ? "" : "bg-[#071224] px-2 py-1 rounded border border-[#0f1d31]"
              )}>
                {property.bedrooms} {compact ? "bd" : "bed"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!compact && <Bath className="h-3 w-3 text-[#FF7A00]" />}
              <span className={cn(
                compact ? "" : "bg-[#071224] px-2 py-1 rounded border border-[#0f1d31]"
              )}>
                {property.bathrooms} {compact ? "ba" : "bath"}
              </span>
            </div>
            <div className="flex items-center gap-1 truncate">
              {!compact && <Square className="h-3 w-3 text-[#FF7A00]" />}
              <span className={cn(
                compact ? "truncate" : "bg-[#071224] px-2 py-1 rounded border border-[#0f1d31]"
              )}>
                {compact 
                  ? `${Number(property.squareFeet).toLocaleString()}sf` 
                  : `${Number(property.squareFeet).toLocaleString()} sqft`
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

interface StatusBadgeProps {
  status: string;
  compact?: boolean;
}

const StatusBadge = ({ status, compact = false }: StatusBadgeProps) => {
  // Ensure we have a valid status string
  const statusText = status?.toString() || 'Unknown';
  
  let bgColor = "";
  let textColor = "";
  let hoverColor = "";
  
  switch (statusText.toLowerCase()) {
    case 'active':
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      hoverColor = "hover:bg-green-200";
      break;
    case 'pending':
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      hoverColor = "hover:bg-amber-200";
      break;
    case 'sold':
      bgColor = "bg-slate-100";
      textColor = "text-slate-800";
      hoverColor = "hover:bg-slate-200";
      break;
    default:
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      hoverColor = "hover:bg-blue-200";
  }
  
  return (
    <Badge className={cn(
      bgColor, 
      textColor, 
      hoverColor,
      compact ? "text-xs px-1.5 py-0.5" : "text-xs sm:text-sm"
    )}>
      {statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase()}
    </Badge>
  );
};

export default PropertyCard;
