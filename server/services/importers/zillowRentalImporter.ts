import { InsertRentalProperty } from '@shared/schema';
import { log } from '../../vite';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';
import { rentalProperties } from '@shared/schema';

interface ZillowRentalListing {
  query: string;
  zpid: string;
  id: string;
  providerListingId: string;
  imgSrc: string;
  hasImage: boolean;
  detailUrl: string;
  statusType: string;
  statusText: string;
  address: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipcode: number;
  units: Array<{
    price: string;
    beds: string;
    roomForRent: boolean;
    baths?: string;
  }>;
  lotId: number;
  isSaved: boolean;
  buildingName: string;
  isBuilding: boolean;
  canSaveBuilding: boolean;
  has3DModel: boolean;
  isFeaturedListing: boolean;
  isShowcaseListing: boolean;
  carouselPhotos: Array<{
    url: string;
  }>;
  availabilityCount: number;
  latLong_latitude: number;
  latLong_longitude: number;
  [key: string]: any; // For other fields that might be present
}

/**
 * Import rental property listings from a Zillow JSON file
 * This uses the JSON format from Outscraper's Zillow scraper
 */
export async function importZillowRentals(filePath: string): Promise<{ imported: number, errors: number }> {
  try {
    log(`Importing Zillow rentals from ${filePath}`, 'import');
    
    // Read and parse the JSON file
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(fileContent) as ZillowRentalListing[];
    
    log(`Found ${data.length} rental listings to import`, 'import');
    
    let imported = 0;
    let errors = 0;
    
    // Process each listing
    for (const listing of data) {
      try {
        // Transform Zillow data to our schema
        const rentalProperty: InsertRentalProperty = {
          externalId: listing.providerListingId || listing.id,
          address: listing.address,
          addressStreet: listing.addressStreet,
          addressCity: listing.addressCity,
          addressState: listing.addressState,
          addressZipcode: listing.addressZipcode,
          buildingName: listing.buildingName,
          statusType: listing.statusType,
          statusText: listing.statusText,
          propertyType: "apartment", // Default for most Zillow rentals
          isBuilding: listing.isBuilding,
          latitude: listing.latLong_latitude,
          longitude: listing.latLong_longitude,
          mainImageUrl: listing.imgSrc,
          detailUrl: listing.detailUrl,
          availabilityCount: listing.availabilityCount,
          images: listing.carouselPhotos,
          units: listing.units,
          source: "zillow",
          rawData: listing
        };
        
        // Insert into database
        await db.insert(rentalProperties).values(rentalProperty);
        imported++;
        
      } catch (error) {
        log(`Error importing rental property: ${error.message}`, 'import');
        errors++;
      }
    }
    
    log(`Successfully imported ${imported} rental properties with ${errors} errors`, 'import');
    return { imported, errors };
    
  } catch (error) {
    log(`Failed to import Zillow rentals: ${error.message}`, 'import');
    throw error;
  }
}

/**
 * Count the number of rental properties in the database
 */
export async function countRentalProperties(): Promise<number> {
  const result = await db.select({ count: sql`count(*)` }).from(rentalProperties);
  return Number(result[0].count);
}