#!/bin/bash

# Load API key
source .env.api-keys

# Set default values
API_KEY=${ATTOM_API_KEY}
BASE_URL="https://api.gateway.attomdata.com"

# Functions to test different endpoints

test_property_address_search() {
  echo "Testing property address search endpoint..."
  curl -s -X GET "${BASE_URL}/propertyapi/v1.0.0/property/address?address1=123%20Main%20St&address2=Atlanta,%20GA%2030301" \
    -H "apikey: ${API_KEY}" \
    -H "Accept: application/json" | jq .
  echo -e "\n"
}

test_property_details() {
  echo "Testing property details endpoint..."
  curl -s -X GET "${BASE_URL}/propertyapi/v1.0.0/property/detail?address1=123%20Main%20St&address2=Atlanta,%20GA%2030301" \
    -H "apikey: ${API_KEY}" \
    -H "Accept: application/json" | jq .
  echo -e "\n"
}

test_property_sale_history() {
  echo "Testing property sale history endpoint..."
  curl -s -X GET "${BASE_URL}/propertyapi/v1.0.0/saleshistory/detail?address1=123%20Main%20St&address2=Atlanta,%20GA%2030301" \
    -H "apikey: ${API_KEY}" \
    -H "Accept: application/json" | jq .
  echo -e "\n"
}

test_market_stats() {
  echo "Testing market statistics endpoint..."
  curl -s -X GET "${BASE_URL}/propertyapi/v1.0.0/areasearch/detail?city=Atlanta&state=GA" \
    -H "apikey: ${API_KEY}" \
    -H "Accept: application/json" | jq .
  echo -e "\n"
}

test_market_snapshot() {
  echo "Testing market snapshot endpoint..."
  curl -s -X GET "${BASE_URL}/propertyapi/v1.0.0/snapshot?city=Atlanta&state=GA" \
    -H "apikey: ${API_KEY}" \
    -H "Accept: application/json" | jq .
  echo -e "\n"
}

# Check if API key is available
if [ -z "$API_KEY" ]; then
  echo "Error: ATTOM API key not found. Please check your .env.api-keys file."
  exit 1
fi

# Display help info
echo "==============================================="
echo "ATTOM API Test Script"
echo "==============================================="
echo "This script tests the ATTOM API endpoints used in the application."
echo "API Key: ${API_KEY:0:5}...${API_KEY: -5}"
echo "Base URL: ${BASE_URL}"
echo "==============================================="

# Run tests based on command line argument or run all tests
if [ "$1" == "address" ]; then
  test_property_address_search
elif [ "$1" == "details" ]; then
  test_property_details
elif [ "$1" == "history" ]; then
  test_property_sale_history
elif [ "$1" == "stats" ]; then
  test_market_stats
elif [ "$1" == "snapshot" ]; then
  test_market_snapshot
else
  echo "Running all tests..."
  echo "==============================================="
  
  test_property_address_search
  test_property_details
  test_property_sale_history
  test_market_stats
  test_market_snapshot
  
  echo "==============================================="
  echo "All tests completed."
fi