import { db } from '../server/db';
import path from 'path';
import fs from 'fs';
import { rentalProperties } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Define the Zillow rental listing interface
interface ZillowRentalListing {
  providerListingId: string;
  id?: string;
  address: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipcode: number;
  buildingName?: string;
  statusType: string;
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
    console.log('Starting rental data import script...');
    
    // Verify database connection
    try {
      const testResult = await db.execute(sql`SELECT 1 as test`);
      console.log('Database connection successful:', testResult);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      process.exit(1);
    }
    
    // Get current working directory
    const cwd = process.cwd();
    console.log('Current working directory:', cwd);
    
    // Define the sample file path
    const sampleFile = path.join(cwd, 'attached_assets/simple-rentals-sample.json');
    console.log('Using sample file:', sampleFile);
    
    // Check if the file exists
    if (!fs.existsSync(sampleFile)) {
      console.error('Sample file not found:', sampleFile);
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
      
      // Process each listing
      let imported = 0;
      let errors = 0;
      
      for (const listing of data) {
        try {
          console.log('Processing listing:', listing.address);
          
          // Transform data to our schema
          const rentalProperty = {
            externalId: listing.providerListingId || listing.id,
            address: listing.address,
            addressStreet: listing.addressStreet,
            addressCity: listing.addressCity,
            addressState: listing.addressState,
            addressZipcode: listing.addressZipcode,
            buildingName: listing.buildingName,
            statusType: listing.statusType,
            statusText: listing.statusText,
            propertyType: listing.propertyType || "apartment",
            isBuilding: listing.isBuilding || false,
            latitude: listing.latLong_latitude,
            longitude: listing.latLong_longitude,
            mainImageUrl: listing.imgSrc,
            detailUrl: listing.detailUrl,
            availabilityCount: listing.availabilityCount,
            description: '',
            amenities: [],
            images: listing.carouselPhotos,
            units: listing.units,
            source: "zillow",
            rawData: listing
          };
          
          console.log('Prepared rental property data');
          
          // Debug database insert
          console.log('Inserting into database...');
          const result = await db.insert(rentalProperties).values(rentalProperty);
          console.log('Insert result:', result);
          
          imported++;
          console.log('Successfully imported rental property');
        } catch (error) {
          console.error('Error importing rental property:', error);
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