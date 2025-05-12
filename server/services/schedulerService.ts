/**
 * Scheduler Service - Manages scheduled background jobs
 */
import { synchronizeMLSData } from './integrationService';
import { syncAttomMarketData } from './attomService';

// Define job schedules (time in milliseconds)
const SCHEDULES = {
  MLS_SYNC: 3600000, // Every hour (60 * 60 * 1000)
  MARKET_DATA_SYNC: 43200000, // Every 12 hours (12 * 60 * 60 * 1000)
  CLEANUP_OLD_DATA: 86400000, // Every 24 hours (24 * 60 * 60 * 1000)
};

// Track active interval timers
const activeJobs: Record<string, NodeJS.Timeout> = {};

/**
 * Start scheduled synchronization of MLS property data
 */
export function startMLSSync(intervalMs: number = SCHEDULES.MLS_SYNC) {
  console.log(`Starting scheduled MLS data sync every ${intervalMs/60000} minutes`);
  
  // Stop existing job if running
  stopJob('mlsSync');
  
  // Run immediately on startup
  runMLSSync();
  
  // Schedule recurring job
  activeJobs['mlsSync'] = setInterval(runMLSSync, intervalMs);
  
  return true;
}

/**
 * Run MLS synchronization
 */
async function runMLSSync() {
  console.log('Running scheduled MLS data synchronization');
  try {
    // Limit to 100 properties per sync to avoid API rate limits
    await synchronizeMLSData(100);
    console.log('Scheduled MLS synchronization completed successfully');
  } catch (error) {
    console.error('Error during scheduled MLS synchronization:', error);
  }
}

/**
 * Start scheduled synchronization of market data using ATTOM API
 */
export function startMarketDataSync(intervalMs: number = SCHEDULES.MARKET_DATA_SYNC) {
  console.log(`Starting scheduled market data sync every ${intervalMs/60000} minutes`);
  
  // Stop existing job if running
  stopJob('marketDataSync');
  
  // Run immediately on startup
  runMarketDataSync();
  
  // Schedule recurring job
  activeJobs['marketDataSync'] = setInterval(runMarketDataSync, intervalMs);
  
  return true;
}

/**
 * Run market data synchronization
 */
async function runMarketDataSync() {
  console.log('Running scheduled market data synchronization');
  try {
    // Get a list of locations to sync (could be from database or configuration)
    const locations = [
      { city: 'Atlanta', state: 'GA' },
      { city: 'Canton', state: 'GA' },
      { city: 'Woodstock', state: 'GA' },
      { city: 'Alpharetta', state: 'GA' }
    ];
    
    await syncAttomMarketData(locations);
    console.log('Scheduled market data synchronization completed successfully');
  } catch (error) {
    console.error('Error during scheduled market data synchronization:', error);
  }
}

/**
 * Stop a scheduled job
 */
export function stopJob(jobName: string) {
  if (activeJobs[jobName]) {
    clearInterval(activeJobs[jobName]);
    delete activeJobs[jobName];
    console.log(`Stopped scheduled job: ${jobName}`);
    return true;
  }
  return false;
}

/**
 * Stop all scheduled jobs
 */
export function stopAllJobs() {
  Object.keys(activeJobs).forEach(stopJob);
  console.log('All scheduled jobs stopped');
  return true;
}

/**
 * Get status of all scheduled jobs
 */
export function getJobStatus() {
  const status: Record<string, any> = {};
  
  Object.keys(activeJobs).forEach(jobName => {
    status[jobName] = {
      running: !!activeJobs[jobName],
      interval: jobName === 'mlsSync' ? SCHEDULES.MLS_SYNC : 
                jobName === 'marketDataSync' ? SCHEDULES.MARKET_DATA_SYNC : 
                SCHEDULES.CLEANUP_OLD_DATA
    };
  });
  
  return status;
}