// Simple script to test ATTOM API endpoints

async function testAttomAPI() {
  console.log("Testing ATTOM API connection...");
  
  try {
    const response = await fetch('http://localhost:5000/api/attom/test-connection');
    const data = await response.json();
    console.log("Test connection response:");
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...");
    
    console.log("\nTesting update market data...");
    const updateResponse = await fetch('http://localhost:5000/api/attom/test-update-market-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        city: "Canton",
        state: "GA",
        zipCode: "30115"
      })
    });
    
    const updateData = await updateResponse.json();
    console.log("Update market data response:");
    console.log(JSON.stringify(updateData, null, 2).substring(0, 500) + "...");
    
    console.log("\nTesting sync market data...");
    const syncResponse = await fetch('http://localhost:5000/api/attom/test-sync-market-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: [
          { city: "Canton", state: "GA", zipCode: "30115" },
          { city: "Woodstock", state: "GA", zipCode: "30188" }
        ]
      })
    });
    
    const syncData = await syncResponse.json();
    console.log("Sync market data response:");
    console.log(JSON.stringify(syncData, null, 2).substring(0, 500) + "...");
    
  } catch (error) {
    console.error("Error testing ATTOM API:", error);
  }
}

testAttomAPI();