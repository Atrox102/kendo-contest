import { seedDatabase } from './seed-database';

// Configuration
const SCHEDULE_CONFIG = {
  intervalHours: 1,
  enableLogging: true,
  maxRetries: 3,
  retryDelayMs: 5000
};

class DatabaseScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastRunTime: Date | null = null;
  private runCount = 0;
  private errorCount = 0;

  constructor() {
    this.log('🚀 Database Scheduler initialized');
    this.log(`⏰ Configured to run every ${SCHEDULE_CONFIG.intervalHours} hour(s)`);
  }

  private log(message: string) {
    if (SCHEDULE_CONFIG.enableLogging) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`);
    }
  }

  private async runWithRetry(): Promise<void> {
    let attempt = 0;
    
    while (attempt < SCHEDULE_CONFIG.maxRetries) {
      try {
        attempt++;
        this.log(`🔄 Seeding attempt ${attempt}/${SCHEDULE_CONFIG.maxRetries}`);
        
        await seedDatabase();
        
        this.runCount++;
        this.lastRunTime = new Date();
        this.log(`✅ Seeding completed successfully (Run #${this.runCount})`);
        return;
        
      } catch (error) {
        this.errorCount++;
        this.log(`❌ Seeding attempt ${attempt} failed: ${error}`);
        
        if (attempt < SCHEDULE_CONFIG.maxRetries) {
          this.log(`⏳ Retrying in ${SCHEDULE_CONFIG.retryDelayMs / 1000} seconds...`);
          await this.delay(SCHEDULE_CONFIG.retryDelayMs);
        } else {
          this.log(`💥 All ${SCHEDULE_CONFIG.maxRetries} attempts failed. Will try again on next scheduled run.`);
          throw error;
        }
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async scheduledRun(): Promise<void> {
    if (this.isRunning) {
      this.log('⚠️  Previous seeding still running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    this.log('🌱 Starting scheduled database seeding...');

    try {
      await this.runWithRetry();
    } catch (error) {
      this.log(`💥 Scheduled seeding failed after all retries: ${error}`);
    } finally {
      this.isRunning = false;
      this.log('🏁 Scheduled seeding cycle completed');
    }
  }

  start(): void {
    if (this.intervalId) {
      this.log('⚠️  Scheduler is already running');
      return;
    }

    this.log('▶️  Starting scheduler...');
    
    // Run immediately on start
    this.scheduledRun();
    
    // Schedule recurring runs
    const intervalMs = SCHEDULE_CONFIG.intervalHours * 60 * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.scheduledRun();
    }, intervalMs);

    this.log(`✅ Scheduler started successfully`);
    this.log(`📅 Next run scheduled in ${SCHEDULE_CONFIG.intervalHours} hour(s)`);
  }

  stop(): void {
    if (!this.intervalId) {
      this.log('⚠️  Scheduler is not running');
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.log('⏹️  Scheduler stopped');
  }

  getStatus(): {
    isRunning: boolean;
    isCurrentlySeeding: boolean;
    lastRunTime: Date | null;
    runCount: number;
    errorCount: number;
    nextRunTime: Date | null;
  } {
    const nextRunTime = this.lastRunTime 
      ? new Date(this.lastRunTime.getTime() + (SCHEDULE_CONFIG.intervalHours * 60 * 60 * 1000))
      : null;

    return {
      isRunning: this.intervalId !== null,
      isCurrentlySeeding: this.isRunning,
      lastRunTime: this.lastRunTime,
      runCount: this.runCount,
      errorCount: this.errorCount,
      nextRunTime
    };
  }

  printStatus(): void {
    const status = this.getStatus();
    
    console.log('\n📊 Database Scheduler Status:');
    console.log(`   • Running: ${status.isRunning ? '✅' : '❌'}`);
    console.log(`   • Currently Seeding: ${status.isCurrentlySeeding ? '🔄' : '💤'}`);
    console.log(`   • Last Run: ${status.lastRunTime ? status.lastRunTime.toLocaleString() : 'Never'}`);
    console.log(`   • Next Run: ${status.nextRunTime ? status.nextRunTime.toLocaleString() : 'Not scheduled'}`);
    console.log(`   • Total Runs: ${status.runCount}`);
    console.log(`   • Total Errors: ${status.errorCount}`);
    console.log(`   • Interval: ${SCHEDULE_CONFIG.intervalHours} hour(s)`);
  }
}

// Create global scheduler instance
const scheduler = new DatabaseScheduler();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

// Export for use in other modules
export { DatabaseScheduler, scheduler };

// Run scheduler if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Starting Database Scheduler...');
  console.log('💡 Press Ctrl+C to stop the scheduler');
  
  scheduler.start();
  
  // Print status every 10 minutes
  setInterval(() => {
    scheduler.printStatus();
  }, 10 * 60 * 1000);
}