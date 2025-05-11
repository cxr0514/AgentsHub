import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Home } from "lucide-react";
import { Property } from "@shared/schema";
import { Link } from "wouter";

interface PropertyCardProps {
  property: Property;
  onSave?: (propertyId: number) => void;
  isSaved?: boolean;
}

const PropertyCard = ({ property, onSave, isSaved = false }: PropertyCardProps) => {
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

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={property.address}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="h-48 w-full bg-muted flex items-center justify-center">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="icon"
              className={`rounded-full ${isSaved ? 'bg-accent text-accent-foreground' : 'bg-white/80'}`}
              onClick={handleSaveClick}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <div className="font-semibold text-lg">${Number(property.price).toLocaleString()}</div>
            <StatusBadge status={property.status} />
          </div>

          <h3 className="font-medium text-primary truncate">{property.address}</h3>
          <p className="text-sm text-text-secondary truncate">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}
            {property.city}, {property.state}
          </p>

          <div className="flex justify-between mt-3 text-sm">
            <div>{property.bedrooms} bed</div>
            <div>{property.bathrooms} bath</div>
            <div>{Number(property.squareFeet).toLocaleString()} sqft</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  // Ensure we have a valid status string
  const statusText = status?.toString() || 'Unknown';
  
  switch (statusText.toLowerCase()) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
          Pending
        </Badge>
      );
    case 'sold':
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">
          Sold
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
          {statusText}
        </Badge>
      );
  }
};

export default PropertyCard;
