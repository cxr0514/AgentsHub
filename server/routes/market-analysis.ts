import { Router } from 'express';
import { getMarketInsights, generateMarketReport, getPropertyRecommendations, analyzePropertyInvestment } from '../services/perplexityService';
import { log } from '../vite';

const router = Router();

// Get market insights for a location
router.get('/insights/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { type = 'trend' } = req.query;
    
    const analysisType = type as 'trend' | 'prediction' | 'risk' | 'opportunity';
    
    const insights = await getMarketInsights(location, analysisType);
    res.json(insights);
  } catch (error) {
    log(`Error getting market insights: ${error.message}`, 'market-analysis');
    res.status(500).json({ error: error.message });
  }
});

// Generate a full market report for a location
router.get('/report/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { propertyType = 'residential' } = req.query;
    
    const report = await generateMarketReport(location, propertyType as string);
    res.json({ report });
  } catch (error) {
    log(`Error generating market report: ${error.message}`, 'market-analysis');
    res.status(500).json({ error: error.message });
  }
});

// Get property recommendations for a location and budget
router.get('/recommendations', async (req, res) => {
  try {
    const { location, budget, strategy = 'cashflow', propertyType = 'single-family' } = req.query;
    
    if (!location || !budget) {
      return res.status(400).json({ error: 'Location and budget are required' });
    }
    
    const budgetNum = parseInt(budget as string, 10);
    if (isNaN(budgetNum)) {
      return res.status(400).json({ error: 'Budget must be a number' });
    }
    
    const investmentStrategy = strategy as 'cashflow' | 'appreciation' | 'value-add' | 'flip';
    
    const recommendations = await getPropertyRecommendations(
      location as string, 
      budgetNum,
      investmentStrategy,
      propertyType as string
    );
    
    res.json({ recommendations });
  } catch (error) {
    log(`Error getting property recommendations: ${error.message}`, 'market-analysis');
    res.status(500).json({ error: error.message });
  }
});

// Analyze a specific property as an investment
router.post('/analyze-property', async (req, res) => {
  try {
    const { address, price, propertyType, sqft, beds, baths } = req.body;
    
    if (!address || !price || !propertyType || !sqft || !beds || !baths) {
      return res.status(400).json({ 
        error: 'Missing required property details',
        required: ['address', 'price', 'propertyType', 'sqft', 'beds', 'baths']
      });
    }
    
    const analysis = await analyzePropertyInvestment(
      address,
      price,
      propertyType,
      sqft,
      beds,
      baths
    );
    
    res.json({ analysis });
  } catch (error) {
    log(`Error analyzing property investment: ${error.message}`, 'market-analysis');
    res.status(500).json({ error: error.message });
  }
});

export default router;