import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function applySchema() {
  try {
    console.log('Creating rental_properties table if it does not exist...');
    
    // Create the rental_properties table with all required columns
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rental_properties (
        id SERIAL PRIMARY KEY,
        external_id TEXT,
        address TEXT NOT NULL,
        address_street TEXT,
        address_city TEXT NOT NULL,
        address_state TEXT NOT NULL,
        address_zipcode INTEGER NOT NULL,
        building_name TEXT,
        status_type TEXT,
        status_text TEXT,
        property_type TEXT,
        is_building BOOLEAN DEFAULT false,
        main_image_url TEXT,
        detail_url TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        availability_count INTEGER,
        units JSONB,
        images JSONB,
        description TEXT,
        amenities JSONB,
        source TEXT,
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('Table rental_properties created or already exists.');
    
    console.log('Checking for missing columns and adding them if needed...');
    
    // Check if description column exists, add if not
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rental_properties' AND column_name = 'description'
        ) THEN
          ALTER TABLE rental_properties ADD COLUMN description TEXT;
        END IF;
      END $$;
    `);
    
    // Check if amenities column exists, add if not
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rental_properties' AND column_name = 'amenities'
        ) THEN
          ALTER TABLE rental_properties ADD COLUMN amenities JSONB;
        END IF;
      END $$;
    `);
    
    // Check if updated_at column exists, add if not
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rental_properties' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE rental_properties ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;
    `);
    
    console.log('Finished checking and updating columns.');
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('Error applying schema:', error);
    // Exit with error
    process.exit(1);
  }
}

// Execute the function
applySchema();