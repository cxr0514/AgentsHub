import { InsertProperty, Property } from "@shared/schema";

/**
 * Parse CSV file content into an array of property data
 */
export async function parseCSVtoProperties(file: File): Promise<Partial<InsertProperty>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || !event.target.result) {
          reject(new Error("Failed to read file"));
          return;
        }
        
        const csv = event.target.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Map CSV columns to property fields
        const propertyData: Partial<InsertProperty>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines
          
          const values = lines[i].split(',').map(value => value.trim());
          const property: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            // Map CSV headers to property fields
            const fieldName = mapHeaderToField(header);
            if (fieldName && index < values.length) {
              property[fieldName] = values[index];
            }
          });
          
          // Skip rows without essential data
          if (property.address && property.city && property.state) {
            propertyData.push(property as Partial<InsertProperty>);
          }
        }
        
        resolve(propertyData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Map CSV headers to property schema fields
 */
function mapHeaderToField(header: string): string | null {
  // Normalize header (lowercase, remove special chars)
  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Map common CSV header variations to our schema fields
  const headerMap: Record<string, string> = {
    // Address fields
    'address': 'address',
    'streetaddress': 'address',
    'propertyaddress': 'address',
    'street': 'address',
    'city': 'city',
    'state': 'state',
    'zip': 'zipCode',
    'zipcode': 'zipCode',
    'postalcode': 'zipCode',
    'neighborhood': 'neighborhood',
    
    // Property details
    'price': 'price',
    'listprice': 'price',
    'saleprice': 'price',
    'beds': 'bedrooms',
    'bedrooms': 'bedrooms',
    'baths': 'bathrooms',
    'bathrooms': 'bathrooms',
    'sqft': 'squareFeet',
    'squarefeet': 'squareFeet',
    'squarefootage': 'squareFeet',
    'lotsize': 'lotSize',
    'lot': 'lotSize',
    'yearbuilt': 'yearBuilt',
    'year': 'yearBuilt',
    
    // Property attributes
    'type': 'propertyType',
    'propertytype': 'propertyType',
    'status': 'status',
    'daysonmarket': 'daysOnMarket',
    'dom': 'daysOnMarket',
    'saledate': 'saleDate',
    'sold': 'saleDate',
    'solddate': 'saleDate',
    'latitude': 'latitude',
    'lat': 'latitude',
    'longitude': 'longitude',
    'long': 'longitude',
    'lng': 'longitude',
    
    // Features
    'basement': 'hasBasement',
    'hasbasement': 'hasBasement',
    'garage': 'hasGarage',
    'hasgarage': 'hasGarage',
    'garagespaces': 'garageSpaces',
    'description': 'description',
  };
  
  return headerMap[normalized] || null;
}

/**
 * Upload parsed property data to the database
 */
export async function uploadPropertiesToDatabase(properties: Partial<InsertProperty>[]): Promise<{
  success: boolean;
  imported: number;
  failed: number;
  message: string;
}> {
  try {
    const response = await fetch('/api/properties/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to import properties');
    }
    
    const result = await response.json();
    return {
      success: true,
      imported: result.imported || 0,
      failed: result.failed || 0,
      message: result.message || 'Properties imported successfully'
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: properties.length,
      message: error instanceof Error ? error.message : 'Unknown error during import'
    };
  }
}