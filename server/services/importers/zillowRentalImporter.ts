import { InsertRentalProperty } from '@shared/schema';
import { log } from '../../vite';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';
import { rentalProperties } from '@shared/schema';
import { sql } from 'drizzle-orm';

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
    log(`Resolved path: ${fullPath}`, 'import');
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    
    log(`File exists, reading content...`, 'import');
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    log(`File content length: ${fileContent.length} bytes`, 'import');
    
    try {
      const data = JSON.parse(fileContent) as ZillowRentalListing[];
      log(`Successfully parsed JSON data with ${data.length} rental listings to import`, 'import');
      
      let imported = 0;
      let errors = 0;
      
      // Process each listing
      for (const listing of data) {
        try {
          // Log the current listing we're processing
          log(`Processing listing: ${listing.address}`, 'import');
          
          // Transform Zillow data to our schema
          const rentalProperty: InsertRentalProperty = {
            externalId: listing.providerListingId || listing.id,
            address: listing.address,
            addressStreet: listing.addressStreet,
            addressCity: listing.addressCity,
            addressState: listing.addressState,
            addressZipcode: listing.addressZipcode,
            buildingName: listing.buildingName,
            statusType: listing.statusType || 'FOR_RENT',
            statusText: listing.statusText,
            propertyType: "apartment", // Default for most Zillow rentals
            isBuilding: listing.isBuilding,
            latitude: listing.latLong_latitude,
            longitude: listing.latLong_longitude,
            mainImageUrl: listing.imgSrc,
            detailUrl: listing.detailUrl,
            availabilityCount: listing.availabilityCount,
            description: '', // Add empty description field
            amenities: [], // Add empty amenities array
            images: listing.carouselPhotos,
            units: listing.units,
            source: "zillow",
            rawData: listing
          };
          
          // Log the prepared rental property data
          log(`Prepared rental property data for: ${rentalProperty.address}`, 'import');
          
          // Insert into database
          await db.insert(rentalProperties).values(rentalProperty);
          log(`Successfully inserted rental property: ${rentalProperty.address}`, 'import');
          imported++;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          log(`Error importing rental property: ${errorMessage}`, 'import');
          errors++;
        }
      }
      
      log(`Successfully imported ${imported} rental properties with ${errors} errors`, 'import');
      return { imported, errors };
      
    } catch (parseError) {
      log(`Failed to parse JSON data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`, 'import');
      throw parseError;
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Failed to import Zillow rentals: ${errorMessage}`, 'import');
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