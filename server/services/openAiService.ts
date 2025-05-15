import OpenAI from "openai";
import { log } from '../vite';
import fs from 'fs';
import { RentalProperty } from '@shared/schema';

// API key file path - same as in api-keys.ts
const API_KEYS_FILE = ".env.api-keys";

// API key interface
interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
}

// Get API keys directly from file without importing
function getApiKeysFromFile(): ApiKey[] {
  try {
    // Initialize API keys file if it doesn't exist
    if (!fs.existsSync(API_KEYS_FILE)) {
      fs.writeFileSync(API_KEYS_FILE, "# API Keys\n", "utf-8");
    }
    
    const fileContent = fs.readFileSync(API_KEYS_FILE, "utf-8");
    const lines = fileContent.split("\n");
    
    const apiKeys: ApiKey[] = [];
    const commentPattern = /^#\s*API_KEY_([a-zA-Z0-9_-]+)=(.+?)\|(.+?)\|(.+?)\|(.+)$/;
    
    for (const line of lines) {
      const match = line.match(commentPattern);
      if (match) {
        apiKeys.push({
          id: match[1],
          name: match[2],
          service: match[3],
          key: match[4],
          createdAt: match[5],
        });
      }
    }
    
    return apiKeys;
  } catch (error) {
    log(`Error loading API keys: ${error instanceof Error ? error.message : 'Unknown error'}`, 'openai');
    return [];
  }
}

// Utility function to get the OpenAI API key
async function getOpenAIApiKey(): Promise<string> {
  // Try to get from environment first
  let openaiApiKey = process.env.OPENAI_API_KEY;
  
  // If not in environment, try to get from file
  if (!openaiApiKey) {
    const apiKeysList = getApiKeysFromFile();
    openaiApiKey = apiKeysList.find((key) => key.service.toLowerCase() === 'openai')?.key;
  }
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not found');
  }
  
  return openaiApiKey;
}

// Initialize OpenAI client
async function getOpenAIClient(): Promise<OpenAI> {
  const apiKey = await getOpenAIApiKey();
  return new OpenAI({ apiKey });
}

// Call OpenAI Chat API
async function callOpenAIChatApi(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const openai = await getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });
    
    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      throw new Error('No content in OpenAI response');
    }
    
    return response.choices[0].message.content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error calling OpenAI API: ${errorMessage}`, 'openai');
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }
}

/**
 * Uses OpenAI to generate an investment analysis for a rental property
 */
export async function analyzeRentalProperty(property: RentalProperty): Promise<string> {
  try {
    // Construct address and property details
    const address = property.buildingName 
      ? `${property.buildingName} (${property.address}, ${property.addressCity}, ${property.addressState} ${property.addressZipcode})`
      : `${property.address}, ${property.addressCity}, ${property.addressState} ${property.addressZipcode}`;
    
    // Get the main unit price and details (or list all if multiple units)
    let unitDetails = '';
    if (property.units && property.units.length > 0) {
      if (property.units.length === 1) {
        const unit = property.units[0];
        unitDetails = `Price: ${unit.price}, Bedrooms: ${unit.beds}${unit.baths ? `, Bathrooms: ${unit.baths}` : ''}`;
      } else {
        unitDetails = 'Multiple units available:\n';
        property.units.forEach((unit, i) => {
          unitDetails += `- Unit ${i+1}: Price: ${unit.price}, Bedrooms: ${unit.beds}${unit.baths ? `, Bathrooms: ${unit.baths}` : ''}\n`;
        });
      }
    }

    // Construct the prompt for rental analysis
    const prompt = `
      I need an investment analysis for the following rental property. Please provide a detailed evaluation with sections.
      
      Property Details:
      - Address: ${address}
      - Property Type: ${property.propertyType}
      - Status: ${property.statusType}
      - ${unitDetails}
      
      For your analysis, please include:
      1. Investment Potential: Evaluate this property as a rental investment
      2. Rental Market: Analysis of the rental market in ${property.addressCity}, ${property.addressState}
      3. Expected Returns: Estimated ROI, cash flow, and cap rate expectations
      4. Pros and Cons: Key advantages and potential risks
      5. Recommendations: Should an investor consider this property and why
      
      Format your response in a well-structured format with clear headings for each section. Use concise language focused on investment value.
    `;

    const systemPrompt = 'You are a real estate investment expert. Provide detailed, data-driven analysis focused on rental properties as investments. Include specific numbers and percentages where possible.';
    return await callOpenAIChatApi(systemPrompt, prompt);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error analyzing rental property: ${errorMessage}`, 'openai');
    
    // Provide a more user-friendly error message
    throw new Error(`Failed to analyze property: ${errorMessage}`);
  }
}

/**
 * Analyze a property as an investment using OpenAI
 * This version accepts individual property parameters
 */
export async function analyzePropertyInvestment(
  address: string,
  price: number,
  propertyType: string,
  squareFeet: number = 0,
  bedrooms: number = 0,
  bathrooms: number = 0
): Promise<string> {
  try {
    // Extract city and state from address
    const matches = address.match(/([^,]+),\s*([^,]+),\s*([A-Z]{2})/);
    const city = matches ? matches[2].trim() : '';
    const state = matches ? matches[3].trim() : '';
    
    // Format property details
    const propertyDetails = [
      `Address: ${address}`,
      `Price: $${price.toLocaleString()}`,
      `Property Type: ${propertyType}`,
    ];
    
    if (squareFeet > 0) propertyDetails.push(`Square Feet: ${squareFeet}`);
    if (bedrooms > 0) propertyDetails.push(`Bedrooms: ${bedrooms}`);
    if (bathrooms > 0) propertyDetails.push(`Bathrooms: ${bathrooms}`);
    
    // Construct the prompt for rental analysis
    const prompt = `
      I need an investment analysis for the following rental property. Please provide a detailed evaluation with sections.
      
      Property Details:
      ${propertyDetails.map(detail => `- ${detail}`).join('\n')}
      
      For your analysis, please include:
      1. Investment Potential: Evaluate this property as a rental investment
      2. Rental Market: Analysis of the rental market in ${city}, ${state}
      3. Expected Returns: Estimated ROI, cash flow, and cap rate expectations
      4. Pros and Cons: Key advantages and potential risks
      5. Recommendations: Should an investor consider this property and why
      
      Format your response in a well-structured format with clear headings for each section. Use concise language focused on investment value.
    `;
    
    const systemPrompt = 'You are a real estate investment expert. Provide detailed, data-driven analysis focused on rental properties as investments. Include specific numbers and percentages where possible.';
    return await callOpenAIChatApi(systemPrompt, prompt);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error analyzing property investment: ${errorMessage}`, 'openai');
    
    // Provide a more user-friendly error message
    throw new Error(`Failed to analyze property investment: ${errorMessage}`);
  }
}

/**
 * Get market insights for a specific location
 */
export async function getMarketInsights(
  location: string,
  analysisType: 'trend' | 'prediction' | 'risk' | 'opportunity' = 'trend'
): Promise<any> {
  try {
    let promptFocus = "";
    let systemPrompt = "";
    
    switch (analysisType) {
      case 'trend':
        promptFocus = "current market trends, price movements, and rental yield data";
        systemPrompt = "You are a real estate market analyst specializing in current trends. Provide factual, data-driven insights about current market conditions.";
        break;
      case 'prediction':
        promptFocus = "future market predictions, projected growth rates, and investment outlook for the next 1-3 years";
        systemPrompt = "You are a real estate market forecaster. Provide forward-looking predictions backed by current data and economic indicators.";
        break;
      case 'risk':
        promptFocus = "potential market risks, economic factors that could affect property values, and risk mitigation strategies";
        systemPrompt = "You are a risk analysis expert in real estate. Identify potential risks and provide balanced assessments with mitigation strategies.";
        break;
      case 'opportunity':
        promptFocus = "emerging investment opportunities, undervalued areas, and potential for high returns";
        systemPrompt = "You are an investment opportunity specialist. Identify promising investment areas and explain their potential with supporting data.";
        break;
    }
    
    const prompt = `
      Provide detailed real estate market insights for ${location}, focusing on ${promptFocus}.
      
      Include the following in your analysis:
      1. Current market overview for ${location}
      2. Key metrics and indicators
      3. Notable trends or patterns
      4. Recommendations for investors
      
      Format your response as JSON with the following structure:
      {
        "overview": "Brief summary",
        "keyMetrics": [
          {"name": "Metric Name", "value": "Metric Value", "trend": "up/down/stable"},
          ...
        ],
        "analysis": "Detailed analysis paragraphs",
        "recommendations": ["Recommendation 1", "Recommendation 2", ...]
      }
    `;
    
    const responseText = await callOpenAIChatApi(systemPrompt, prompt);
    
    // Extract the JSON from the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                      responseText.match(/```\n([\s\S]*?)\n```/) || 
                      responseText.match(/{[\s\S]*}/);
                      
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        log(`Error parsing JSON from OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`, 'openai');
        // If JSON parsing fails, return the raw text
        return { rawResponse: responseText };
      }
    } else {
      // If no JSON found, return the raw text
      return { rawResponse: responseText };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error getting market insights: ${errorMessage}`, 'openai');
    throw new Error(`Failed to get market insights: ${errorMessage}`);
  }
}

/**
 * Generate a comprehensive market report for a location
 */
export async function generateMarketReport(
  location: string,
  propertyType: string = 'residential'
): Promise<string> {
  try {
    const prompt = `
      Generate a comprehensive real estate market report for ${location}, focusing on ${propertyType} properties.
      
      Include the following sections in your report:
      1. Executive Summary
      2. Market Overview
         - Current conditions
         - Historical trends
         - Comparison to regional/national market
      3. Supply and Demand Analysis
         - Inventory levels
         - Days on market
         - Absorption rates
      4. Price Analysis
         - Current pricing
         - Price trends
         - Price forecasts
      5. Rental Market Analysis (if applicable)
         - Rental rates
         - Vacancy rates
         - Rental yield
      6. Investment Outlook
         - ROI potential
         - Risk assessment
         - Opportunity areas
      7. Recommendations
      
      Format your response in markdown with clear headings, subheadings, and bullet points where appropriate.
      Include relevant data points, percentages, and specific figures to support your analysis.
    `;
    
    const systemPrompt = "You are a professional real estate market analyst creating a comprehensive market report. Provide factual, data-driven analysis with specific metrics, trends, and actionable insights.";
    
    return await callOpenAIChatApi(systemPrompt, prompt);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error generating market report: ${errorMessage}`, 'openai');
    throw new Error(`Failed to generate market report: ${errorMessage}`);
  }
}

/**
 * Get property recommendations based on location, budget, and strategy
 */
export async function getPropertyRecommendations(
  location: string,
  budget: number,
  strategy: 'cashflow' | 'appreciation' | 'value-add' | 'flip' = 'cashflow',
  propertyType: string = 'single-family'
): Promise<any> {
  try {
    let strategyDescription = "";
    
    switch (strategy) {
      case 'cashflow':
        strategyDescription = "maximizing monthly rental income and cash flow";
        break;
      case 'appreciation':
        strategyDescription = "long-term appreciation and equity growth";
        break;
      case 'value-add':
        strategyDescription = "properties with renovation/improvement potential to increase value";
        break;
      case 'flip':
        strategyDescription = "short-term purchase, renovation, and resale for profit";
        break;
    }
    
    const prompt = `
      Recommend the best property investment opportunities in ${location} with a budget of $${budget.toLocaleString()}.
      
      Investment Strategy: ${strategyDescription}
      Property Type Focus: ${propertyType}
      
      For your recommendations, include:
      1. Best neighborhoods or sub-markets to target
      2. Specific property characteristics to look for
      3. Expected returns (cash flow, appreciation, etc.)
      4. Potential risks and mitigations
      5. Example property profiles
      
      Format your response as JSON with the following structure:
      {
        "recommendedAreas": [
          {"name": "Area Name", "reasons": ["Reason 1", "Reason 2"], "expectedReturns": "X%"},
          ...
        ],
        "propertyAttributes": ["Attribute 1", "Attribute 2", ...],
        "exampleProperties": [
          {
            "type": "Property Type",
            "bedrooms": X,
            "bathrooms": Y,
            "estimatedPrice": "$XXX,XXX",
            "estimatedRent": "$X,XXX/month",
            "cashOnCashReturn": "X%",
            "appreciationPotential": "X%",
            "notes": "Additional details"
          },
          ...
        ],
        "risks": ["Risk 1", "Risk 2", ...],
        "additionalAdvice": "Further recommendations"
      }
    `;
    
    const systemPrompt = "You are a real estate investment advisor specializing in property recommendations. Provide data-backed recommendations tailored to the investor's location, budget, and strategy.";
    
    const responseText = await callOpenAIChatApi(systemPrompt, prompt);
    
    // Extract the JSON from the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                     responseText.match(/```\n([\s\S]*?)\n```/) || 
                     responseText.match(/{[\s\S]*}/);
                     
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        log(`Error parsing JSON from OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`, 'openai');
        // If JSON parsing fails, return the raw text
        return { rawResponse: responseText };
      }
    } else {
      // If no JSON found, return the raw text
      return { rawResponse: responseText };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error getting property recommendations: ${errorMessage}`, 'openai');
    throw new Error(`Failed to get property recommendations: ${errorMessage}`);
  }
}