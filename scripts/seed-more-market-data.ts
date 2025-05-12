import { db } from "../server/db";
import { marketData } from "../shared/schema";
import { eq, and } from "drizzle-orm";

function getBasePrice(city: string): number {
  // Base price mapping for different cities
  const basePriceMap: Record<string, number> = {
    "Canton": 370000,
    "Woodstock": 420000,
    "Alpharetta": 550000,
    "Roswell": 480000,
    "Duluth": 395000
  };
  
  return basePriceMap[city] || 400000;
}

async function seedMoreMarketData() {
  console.log("Seeding additional market data...");

  // Generate data for Canton, GA
  const citiesToAdd = [
    {
      city: "Canton",
      state: "GA",
      zipCode: "30115",
      basePrice: getBasePrice("Canton")
    },
    {
      city: "Woodstock",
      state: "GA",
      zipCode: "30188",
      basePrice: getBasePrice("Woodstock")
    },
    {
      city: "Alpharetta",
      state: "GA",
      zipCode: "30004",
      basePrice: getBasePrice("Alpharetta")
    }
  ];

  // Current month and year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Generate data for the last 12 months
  const allMarketData = [];
  
  for (const cityInfo of citiesToAdd) {
    // Clear existing data for this city/state
    await db.delete(marketData)
      .where(
        and(
          eq(marketData.city, cityInfo.city),
          eq(marketData.state, cityInfo.state)
        )
      );
    console.log(`Cleared existing market data for ${cityInfo.city}, ${cityInfo.state}`);
    
    for (let i = 0; i < 12; i++) {
      // Calculate month and year (going backwards from current date)
      let month = currentMonth - i;
      let year = currentYear;
      
      // Handle month rollover
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      // Adjust price based on trends and randomness
      const monthlyChange = (Math.random() * 0.03) - 0.01; // -1% to +2% change
      const priceMultiplier = 1 + (monthlyChange * i);
      const price = Math.round(cityInfo.basePrice * priceMultiplier);
      
      // Create data point
      allMarketData.push({
        city: cityInfo.city,
        state: cityInfo.state,
        zipCode: cityInfo.zipCode,
        month,
        year,
        daysOnMarket: Math.round(25 + (Math.random() * 15)), // 25-40 days
        medianPrice: price.toString(),
        averagePricePerSqft: Math.round(price / 1600).toString(), // Approximate price per sqft
        activeListings: Math.round(100 + (Math.random() * 100)), // 100-200 listings
        inventoryMonths: 2.5 + (Math.random() * 2), // 2.5-4.5 months
        saleToListRatio: 0.95 + (Math.random() * 0.04), // 95-99%
        priceReductions: Math.round(10 + (Math.random() * 15)), // 10-25%
        marketType: price > cityInfo.basePrice ? "Seller's Market" : "Buyer's Market"
      });
    }
  }

  // Add createdAt field to each data entry
  const now = new Date();
  const dataWithTimestamp = allMarketData.map(data => ({
    ...data,
    createdAt: now
  }));

  // Insert market data
  await db.insert(marketData).values(dataWithTimestamp);

  console.log(`Seeded ${dataWithTimestamp.length} additional market data entries`);
}

// Execute the seed function
seedMoreMarketData()
  .then(() => {
    console.log("Additional market data seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding additional market data:", error);
    process.exit(1);
  });