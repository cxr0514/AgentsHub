#!/bin/bash

# Script to test the ATTOM API integration
# This script tests the updated API endpoints and connection

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for the API
BASE_URL="http://localhost:5000/api/attom"

# Test addresses
ADDRESSES=(
  "123 Main St"
  "45 Oak Ave"
  "789 Maple Rd"
)

# Test cities
CITIES=(
  "Canton"
  "Woodstock"
  "Alpharetta"
)

# Test state
STATE="GA"

# Test zip codes
ZIP_CODES=(
  "30115"
  "30188"
  "30004"
)

echo -e "${BLUE}=== ATTOM API Integration Test ===${NC}"
echo "Testing updated endpoints with improved error handling"
echo ""

# Check if server is running
echo -e "${BLUE}Checking if the server is running...${NC}"
SERVER_CHECK=$(curl -s "http://localhost:5000/api/health" || echo "failed")

if [[ $SERVER_CHECK == *"failed"* ]]; then
  echo -e "${RED}Server is not running. Please start the server first.${NC}"
  exit 1
else
  echo -e "${GREEN}Server is running.${NC}"
fi

# Test market statistics endpoint
echo -e "\n${BLUE}Testing Market Statistics Endpoint...${NC}"

for i in "${!CITIES[@]}"; do
  CITY=${CITIES[$i]}
  ZIP=${ZIP_CODES[$i]}
  
  echo -e "${YELLOW}Testing market statistics for ${CITY}, ${STATE} ${ZIP}${NC}"
  
  RESPONSE=$(curl -s "${BASE_URL}/test-connection?city=${CITY}&state=${STATE}&zipCode=${ZIP}")
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    if [[ $RESPONSE == *"source\":\"api\""* ]]; then
      echo -e "${GREEN}✓ Successfully connected to ATTOM API for ${CITY}, using real API data${NC}"
    else
      echo -e "${YELLOW}⚠ Connected to ATTOM API for ${CITY}, but using fallback data${NC}"
    fi
  else
    echo -e "${RED}✗ Failed to connect to ATTOM API for ${CITY}${NC}"
  fi
done

# Test property details endpoint
echo -e "\n${BLUE}Testing Property Details Endpoint...${NC}"

for i in "${!ADDRESSES[@]}"; do
  ADDRESS=${ADDRESSES[$i]}
  CITY=${CITIES[$i]}
  ZIP=${ZIP_CODES[$i]}
  
  # URL encode the address
  ENCODED_ADDRESS=$(echo $ADDRESS | sed 's/ /%20/g')
  
  echo -e "${YELLOW}Testing property details for ${ADDRESS}, ${CITY}, ${STATE} ${ZIP}${NC}"
  
  RESPONSE=$(curl -s "${BASE_URL}/test-property-details?address=${ENCODED_ADDRESS}&city=${CITY}&state=${STATE}&zipCode=${ZIP}")
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    echo -e "${GREEN}✓ Successfully fetched property details${NC}"
  else
    echo -e "${RED}✗ Failed to fetch property details${NC}"
  fi
done

# Test property sale history endpoint
echo -e "\n${BLUE}Testing Property Sale History Endpoint...${NC}"

for i in "${!ADDRESSES[@]}"; do
  ADDRESS=${ADDRESSES[$i]}
  CITY=${CITIES[$i]}
  ZIP=${ZIP_CODES[$i]}
  
  # URL encode the address
  ENCODED_ADDRESS=$(echo $ADDRESS | sed 's/ /%20/g')
  
  echo -e "${YELLOW}Testing property sale history for ${ADDRESS}, ${CITY}, ${STATE} ${ZIP}${NC}"
  
  RESPONSE=$(curl -s "${BASE_URL}/test-property-history?address=${ENCODED_ADDRESS}&city=${CITY}&state=${STATE}&zipCode=${ZIP}")
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    echo -e "${GREEN}✓ Successfully fetched property sale history${NC}"
  else
    echo -e "${RED}✗ Failed to fetch property sale history${NC}"
  fi
done

echo -e "\n${BLUE}=== Test Complete ===${NC}"
echo "Check the server logs for more detailed information about any failed requests"