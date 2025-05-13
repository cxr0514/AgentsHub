import { db } from '../server/db';
import path from 'path';
import fs from 'fs';
import { rentalProperties } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Define the Zillow rental listing interface
interface ZillowRentalListing {
  providerListingId?: string;
  id?: string;
  address?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: number;
  buildingName?: string;
  statusType?: string;
  statusText?: string;
  propertyType?: string;
  isBuilding?: boolean;
  latLong_latitude?: number;
  latLong_longitude?: number;
  imgSrc?: string;
  detailUrl?: string;
  availabilityCount?: number;
  carouselPhotos?: Array<{url: string}>;
  units?: Array<{
    price: string;
    beds: string;
    roomForRent: boolean;
    baths?: string;
  }>;
  [key: string]: any;
}

async function importRentalData() {
  try {
    console.log('Starting Outscraper rental data import script...');
    
    // Verify database connection
    try {
      const testResult = await db.execute(sql`SELECT 1 as test`);
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      process.exit(1);
    }
    
    // Get current working directory
    const cwd = process.cwd();
    
    // Define the sample file path
    const sampleFile = path.join(cwd, 'attached_assets/Outscraper-20250513184410s1c.json');
    console.log('Using file:', sampleFile);
    
    // Check if the file exists
    if (!fs.existsSync(sampleFile)) {
      console.error('File not found:', sampleFile);
      process.exit(1);
    }
    
    // Read and parse the JSON file
    console.log('Reading file content...');
    const fileContent = fs.readFileSync(sampleFile, 'utf8');
    console.log('File content length:', fileContent.length, 'bytes');
    
    // Parse JSON
    console.log('Parsing JSON...');
    try {
      const data = JSON.parse(fileContent) as ZillowRentalListing[];
      console.log('Successfully parsed JSON data. Found', data.length, 'rental listings to import');
      
      // Process first 5 records only for testing
      const testRecords = data.slice(0, 5);
      console.log('Processing first 5 records for testing');
      
      // Process each listing
      let imported = 0;
      let errors = 0;
      
      for (const listing of testRecords) {
        try {
          console.log('Processing listing:', listing.address || 'Unknown address');
          
          // Create a safe version of the data without circular references
          const safeRawData = { ...listing };
          if (typeof safeRawData.rawData === 'object' && safeRawData.rawData !== null) {
            delete safeRawData.rawData;
          }
          
          // Check each property for validity
          if (!listing.address) {
            console.warn('Missing address in listing');
          }
          if (!listing.addressCity) {
            console.warn('Missing city in listing:', listing.address);
          }
          if (!listing.addressState) {
            console.warn('Missing state in listing:', listing.address);
          }
          
          // Transform Zillow data to our schema with fallbacks
          const rentalProperty = {
            externalId: listing.providerListingId || listing.id || 'unknown-' + imported,
            address: listing.address || 'No address',
            addressStreet: listing.addressStreet || '',
            addressCity: listing.addressCity || 'Unknown City',
            addressState: listing.addressState || 'Unknown State',
            addressZipcode: listing.addressZipcode || 0,
            buildingName: listing.buildingName || '',
            statusType: listing.statusType || 'FOR_RENT',
            statusText: listing.statusText || '',
            propertyType: listing.propertyType || "apartment",
            isBuilding: !!listing.isBuilding,
            latitude: listing.latLong_latitude,
            longitude: listing.latLong_longitude,
            mainImageUrl: listing.imgSrc || '',
            detailUrl: listing.detailUrl || '',
            availabilityCount: listing.availabilityCount || 0,
            description: '',
            amenities: [],
            images: Array.isArray(listing.carouselPhotos) ? listing.carouselPhotos : [],
            units: Array.isArray(listing.units) ? listing.units : [],
            source: "zillow",
            rawData: safeRawData
          };
          
          console.log('Prepared rental property data');
          
          // Insert into database
          console.log('Inserting into database...');
          try {
            const result = await db.insert(rentalProperties).values(rentalProperty);
            console.log('Insert successful');
            imported++;
          } catch (insertError) {
            console.error('Database insert error:', insertError);
            errors++;
          }
          
        } catch (error) {
          console.error('Error processing rental property:', error);
          errors++;
        }
      }
      
      console.log('Import completed:', imported, 'properties imported with', errors, 'errors');
    } catch (parseError) {
      console.error('Failed to parse JSON data:', parseError);
      process.exit(1);
    }
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

// Execute the function
importRentalData()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });