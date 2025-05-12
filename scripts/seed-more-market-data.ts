import { db } from "../server/db";
import { marketData } from "@shared/schema";

async function seedMoreMarketData() {
  console.log("Seeding additional market data...");

  // Array of popular locations to add data for
  const locations = [
    { city: "San Francisco", state: "CA", zipCode: "94105" },
    { city: "New York", state: "NY", zipCode: "10001" },
    { city: "Seattle", state: "WA", zipCode: "98101" },
    { city: "Boston", state: "MA", zipCode: "02108" },
    { city: "Miami", state: "FL", zipCode: "33101" },
    { city: "Austin", state: "TX", zipCode: "78701" },
    { city: "Chicago", state: "IL", zipCode: "60601" },
    { city: "Denver", state: "CO", zipCode: "80202" },
    { city: "Portland", state: "OR", zipCode: "97201" },
  ];

  // Generate market data for each location for the past 12 months
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  for (const location of locations) {
    console.log(`Adding market data for ${location.city}, ${location.state}`);
    
    for (let i = 0; i < 12; i++) {
      // Calculate month and year, going backwards from current month
      let month = currentMonth - i;
      let year = currentYear;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      // Generate synthetic market data with realistic variations
      const basePrice = getBasePrice(location.city);
      const priceMultiplier = 1 + (i * 0.01) + (Math.random() * 0.04 - 0.02); // Small random variation
      const medianPrice = Math.round(basePrice * priceMultiplier);
      const avgPricePerSqft = Math.round(medianPrice / 1000);
      
      // Make days on market trend downward slightly for desirable markets
      const daysOnMarket = Math.max(15, Math.round(40 - i * 0.5 + (Math.random() * 5 - 2.5)));
      
      // Generate other market indicators with realistic values
      const activeListings = Math.round(100 + Math.random() * 200);
      const inventoryMonths = parseFloat((2 + Math.random() * 3).toFixed(1));
      const saleToListRatio = parseFloat((0.95 + Math.random() * 0.05).toFixed(2));
      const priceReductions = Math.round(10 + Math.random() * 25);
      
      // Determine market type based on metrics
      let marketType = "Balanced";
      if (saleToListRatio > 0.98 && daysOnMarket < 30) {
        marketType = "Seller's Market";
      } else if (saleToListRatio < 0.96 && daysOnMarket > 35) {
        marketType = "Buyer's Market";
      }
      
      // Insert the market data record
      await db.insert(marketData).values({
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        month,
        year,
        medianPrice: medianPrice.toString(),
        averagePricePerSqft: avgPricePerSqft.toString(),
        daysOnMarket,
        activeListings,
        inventoryMonths: inventoryMonths.toString(),
        saleToListRatio: saleToListRatio.toString(),
        priceReductions: priceReductions.toString(),
        marketType,
      });
    }
  }

  console.log("Additional market data seeding complete!");
}

// Helper function to get base prices for different cities
function getBasePrice(city: string): number {
  const basePrices: Record<string, number> = {
    "San Francisco": 1250000,
    "New York": 950000,
    "Seattle": 850000,
    "Boston": 750000,
    "Miami": 550000,
    "Austin": 650000,
    "Chicago": 450000,
    "Denver": 650000,
    "Portland": 600000,
    // Default for any city not listed
    "default": 500000
  };
  
  return basePrices[city] || basePrices.default;
}

// Run the seed function
seedMoreMarketData()
  .catch(e => {
    console.error("Error seeding market data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.end();
    console.log("Database connection closed");
  });