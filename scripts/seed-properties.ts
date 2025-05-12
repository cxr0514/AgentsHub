import { db } from "../server/db";
import { properties } from "../shared/schema";

async function seedProperties() {
  console.log("Seeding properties...");

  // Check if properties already exist
  const existingProps = await db.select().from(properties).limit(1);
  if (existingProps.length > 0) {
    console.log("Properties already exist, skipping seed");
    return;
  }

  // Sample properties for Marietta, GA
  const mariettaProperties = [
    {
      address: "123 Oak Lane",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Oakwood Heights",
      latitude: "33.9526",
      longitude: "-84.5499",
      price: "389000",
      bedrooms: 3,
      bathrooms: "2",
      squareFeet: "1850",
      lotSize: "0.25",
      yearBuilt: 2002,
      propertyType: "Single Family",
      status: "Active",
      description: "Beautiful ranch home in Oakwood Heights with updated kitchen and bathrooms. Open floor plan with large backyard.",
      features: JSON.stringify(["Garage", "Fireplace", "Deck", "Updated Kitchen"]),
    },
    {
      address: "456 Pine Street",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Pine Valley",
      latitude: "33.9456",
      longitude: "-84.5521",
      price: "425000",
      bedrooms: 4,
      bathrooms: "2.5",
      squareFeet: "2200",
      lotSize: "0.3",
      yearBuilt: 2005,
      propertyType: "Single Family",
      status: "Active",
      description: "Spacious two-story home in Pine Valley with finished basement. Large master suite with walk-in closet.",
      features: JSON.stringify(["Basement", "Garage", "Patio", "Hardwood Floors"]),
    },
    {
      address: "789 Maple Drive",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Maple Woods",
      latitude: "33.9512",
      longitude: "-84.5476",
      price: "355000",
      bedrooms: 3,
      bathrooms: "2",
      squareFeet: "1650",
      lotSize: "0.2",
      yearBuilt: 1998,
      propertyType: "Single Family",
      status: "Active",
      description: "Well-maintained home in Maple Woods with updated bathrooms. Fenced backyard with mature trees.",
      features: JSON.stringify(["Garage", "Fenced Yard", "Patio", "Fireplace"]),
    },
    {
      address: "234 Willow Court",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Willow Creek",
      latitude: "33.9489",
      longitude: "-84.5512",
      price: "412000",
      bedrooms: 4,
      bathrooms: "3",
      squareFeet: "2100",
      lotSize: "0.28",
      yearBuilt: 2001,
      propertyType: "Single Family",
      status: "Active",
      description: "Gorgeous two-story home in Willow Creek with open concept main floor. Large kitchen with island and stainless appliances.",
      features: JSON.stringify(["Garage", "Fireplace", "Deck", "Updated Kitchen", "Walk-in Closet"]),
    },
    {
      address: "567 Birch Avenue",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Birchwood",
      latitude: "33.9478",
      longitude: "-84.5532",
      price: "375000",
      bedrooms: 3,
      bathrooms: "2.5",
      squareFeet: "1950",
      lotSize: "0.22",
      yearBuilt: 2000,
      propertyType: "Single Family",
      status: "Pending",
      description: "Beautiful home in Birchwood with newly renovated kitchen. Large master bedroom with ensuite bath.",
      features: JSON.stringify(["Garage", "Fenced Yard", "Deck", "Updated Kitchen"]),
    },
    {
      address: "890 Cedar Lane",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Cedar Heights",
      latitude: "33.9501",
      longitude: "-84.5465",
      price: "329000",
      bedrooms: 3,
      bathrooms: "2",
      squareFeet: "1600",
      lotSize: "0.18",
      yearBuilt: 1995,
      propertyType: "Single Family",
      status: "Active",
      description: "Charming ranch home in Cedar Heights with updated bathrooms. Cozy backyard with patio.",
      features: JSON.stringify(["Garage", "Patio", "Updated Bathrooms"]),
    },
    {
      address: "123 Magnolia Street",
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      neighborhood: "Magnolia Estates",
      latitude: "33.9534",
      longitude: "-84.5487",
      price: "450000",
      bedrooms: 4,
      bathrooms: "3.5",
      squareFeet: "2400",
      lotSize: "0.32",
      yearBuilt: 2008,
      propertyType: "Single Family",
      status: "Active",
      description: "Spacious two-story home in Magnolia Estates with finished basement. Gourmet kitchen with granite countertops.",
      features: JSON.stringify(["Basement", "Garage", "Deck", "Updated Kitchen", "Walk-in Closet"]),
    },
  ];

  // Insert properties
  await db.insert(properties).values(mariettaProperties);

  console.log(`Seeded ${mariettaProperties.length} properties`);
}

// Execute the seed function
seedProperties()
  .then(() => {
    console.log("Property seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding properties:", error);
    process.exit(1);
  });