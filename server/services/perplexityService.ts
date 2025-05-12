import { log } from '../vite';

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MarketInsight {
  insight: string;
  analysisType: 'trend' | 'prediction' | 'risk' | 'opportunity';
  confidence: number; // 0-1
  locationContext: string;
  timeframe: string;
  supportingData?: string;
  citations?: string[];
}

/**
 * Call the Perplexity API to get market insights for a specific location
 */
export async function getMarketInsights(
  location: string,
  analysisType: 'trend' | 'prediction' | 'risk' | 'opportunity' = 'trend'
): Promise<MarketInsight[]> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set');
  }

  try {
    log(`Calling Perplexity API for market insights on ${location}`, 'perplexity');

    const systemPrompt = `You are a real estate market analysis expert. Provide detailed, specific, and quantitative insights about the real estate market in ${location}. Focus on ${analysisType === 'trend' ? 'current trends' : analysisType === 'prediction' ? 'future predictions' : analysisType === 'risk' ? 'potential risks' : 'investment opportunities'}.`;
    
    const userPrompt = `Please analyze the current real estate market in ${location} and provide 3-5 key ${analysisType === 'trend' ? 'trends' : analysisType === 'prediction' ? 'predictions' : analysisType === 'risk' ? 'risks' : 'investment opportunities'} for investors. For each insight, include:
1. A concise description
2. Supporting data points or statistics when possible
3. The timeframe relevant to this insight (e.g., "next 6 months", "2025-2026")
4. A confidence score between 0 and 1

Format your response as clean JSON only, with no text before or after. Use this exact format:
[
  {
    "insight": "Detailed description of the insight",
    "analysisType": "${analysisType}",
    "confidence": 0.8,
    "locationContext": "${location}",
    "timeframe": "Relevant timeframe",
    "supportingData": "Supporting statistics or data points"
  },
  ...
]`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
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
        max_tokens: 1500,
        top_p: 0.9,
        search_domain_filter: ["perplexity.ai"],
        search_recency_filter: "month",
        frequency_penalty: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Perplexity API error: ${response.status} - ${errorText}`, 'perplexity');
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as PerplexityResponse;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Perplexity API response');
    }

    try {
      const insights = JSON.parse(content) as MarketInsight[];
      log(`Successfully retrieved ${insights.length} market insights for ${location}`, 'perplexity');
      
      // Add citations from the API response
      return insights.map(insight => ({
        ...insight,
        citations: data.citations
      }));
    } catch (parseError) {
      log(`Error parsing Perplexity response: ${parseError.message}`, 'perplexity');
      log(`Response content: ${content}`, 'perplexity');
      throw new Error(`Failed to parse Perplexity response: ${parseError.message}`);
    }
  } catch (error) {
    log(`Error calling Perplexity API: ${error.message}`, 'perplexity');
    throw error;
  }
}

/**
 * Generate an AI-powered market report for a specific location
 */
export async function generateMarketReport(
  location: string,
  propertyType: string = 'residential'
): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set');
  }

  try {
    log(`Generating market report for ${location} (${propertyType})`, 'perplexity');

    const systemPrompt = `You are a real estate market analyst creating a comprehensive market report. Provide detailed analysis about the ${propertyType} real estate market in ${location}.`;
    
    const userPrompt = `Generate a comprehensive market report for the ${propertyType} real estate market in ${location}. Include the following sections:

1. Executive Summary
2. Market Overview
   - Current state of the market
   - Key statistics (median price, days on market, inventory levels)
3. Supply and Demand Analysis
4. Price Trends
   - Year-over-year changes
   - Price forecasts
5. Neighborhood Analysis
   - Top performing areas
   - Areas with growth potential
6. Investment Outlook
   - ROI potential
   - Risk assessment
7. Recommendations for Investors

Make the report detailed, data-driven, and actionable for real estate investors.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
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
        temperature: 0.3,
        max_tokens: 4000,
        top_p: 0.9,
        search_domain_filter: ["perplexity.ai"],
        search_recency_filter: "month",
        frequency_penalty: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Perplexity API error: ${response.status} - ${errorText}`, 'perplexity');
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as PerplexityResponse;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Perplexity API response');
    }

    log(`Successfully generated market report for ${location}`, 'perplexity');
    return content;
  } catch (error) {
    log(`Error generating market report: ${error.message}`, 'perplexity');
    throw error;
  }
}

/**
 * Get AI-powered property investment recommendations based on criteria
 */
export async function getPropertyRecommendations(
  location: string,
  budget: number,
  investmentStrategy: 'cashflow' | 'appreciation' | 'value-add' | 'flip' = 'cashflow',
  propertyType: string = 'single-family'
): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set');
  }

  try {
    log(`Getting property recommendations for ${location} (${investmentStrategy}, ${budget})`, 'perplexity');

    const systemPrompt = `You are a real estate investment advisor. Provide specific and actionable recommendations for property investments in ${location} based on the client's budget and investment strategy.`;
    
    const userPrompt = `I'm looking to invest in ${propertyType} properties in ${location} with a budget of $${budget.toLocaleString()}. My primary investment strategy is "${investmentStrategy}".

Please provide me with:

1. A general market assessment for this location and strategy
2. 3-5 specific property types or neighborhoods to consider
3. Key criteria I should look for
4. Potential returns I might expect
5. Risks to be aware of
6. Suggestions for maximizing my investment

Make your recommendations specific, actionable, and based on current market data.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
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
        temperature: 0.3,
        max_tokens: 2500,
        top_p: 0.9,
        search_domain_filter: ["perplexity.ai"],
        search_recency_filter: "month",
        frequency_penalty: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Perplexity API error: ${response.status} - ${errorText}`, 'perplexity');
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as PerplexityResponse;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Perplexity API response');
    }

    log(`Successfully generated property recommendations for ${location}`, 'perplexity');
    return content;
  } catch (error) {
    log(`Error generating property recommendations: ${error.message}`, 'perplexity');
    throw error;
  }
}

/**
 * Analyze a specific property and provide investment analysis
 */
export async function analyzePropertyInvestment(
  address: string,
  price: number,
  propertyType: string,
  sqft: number,
  beds: number,
  baths: number
): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set');
  }

  try {
    log(`Analyzing property investment for ${address}`, 'perplexity');

    const systemPrompt = `You are a real estate investment analyst. Provide a detailed investment analysis for a specific property based on the provided details.`;
    
    const userPrompt = `Please analyze this property as a potential investment:

Property Details:
- Address: ${address}
- Price: $${price.toLocaleString()}
- Type: ${propertyType}
- Size: ${sqft} sq ft
- Bedrooms: ${beds}
- Bathrooms: ${baths}

Include in your analysis:
1. Market value assessment (is this property fairly priced?)
2. Potential for appreciation
3. Rental income potential and cap rate estimate
4. Suggested improvements to increase value
5. Overall investment rating (1-10 scale)
6. Recommendation (buy, pass, or negotiate)

Make your analysis detailed and specific to this property and its location.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
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
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
        search_domain_filter: ["perplexity.ai"],
        search_recency_filter: "month",
        frequency_penalty: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Perplexity API error: ${response.status} - ${errorText}`, 'perplexity');
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as PerplexityResponse;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Perplexity API response');
    }

    log(`Successfully analyzed property investment for ${address}`, 'perplexity');
    return content;
  } catch (error) {
    log(`Error analyzing property investment: ${error.message}`, 'perplexity');
    throw error;
  }
}