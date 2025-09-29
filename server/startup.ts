import { initializeDatabase, closeDatabase } from '../database/db';
import { seedDatabase } from '../scripts/seed-database';
import { DatabaseScheduler } from '../scripts/scheduler';

/**
 * Server startup configuration
 */
interface StartupConfig {
  /** Whether to run initial seeding on startup */
  runInitialSeed: boolean;
  /** Whether to start the hourly scheduler */
  startScheduler: boolean;
  /** Scheduler interval in hours */
  schedulerInterval: number;
  /** Whether to enable verbose logging */
  verbose: boolean;
}

/**
 * Default startup configuration
 */
const DEFAULT_CONFIG: StartupConfig = {
  runInitialSeed: true,
  startScheduler: true,
  schedulerInterval: 1, // 1 hour
  verbose: process.env.NODE_ENV !== 'production'
};

/**
 * Global scheduler instance
 */
let globalScheduler: DatabaseScheduler | null = null;

/**
 * Initialize the database and optionally run seeding and start scheduler
 */
export async function initializeServerDatabase(config: Partial<StartupConfig> = {}): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    if (finalConfig.verbose) {
      console.log('🚀 Starting database initialization...');
    }

    // Initialize database
    initializeDatabase();
    if (finalConfig.verbose) {
      console.log('✅ Database initialized successfully');
    }

    // Start scheduler if enabled (scheduler runs seeding immediately)
    if (finalConfig.startScheduler) {
      if (finalConfig.verbose) {
        console.log(`⏰ Starting database scheduler (${finalConfig.schedulerInterval}h interval)...`);
        console.log('🌱 Scheduler will run initial database seeding immediately...');
      }
      
      globalScheduler = new DatabaseScheduler(finalConfig.schedulerInterval);
      globalScheduler.start();
      
      if (finalConfig.verbose) {
        console.log('✅ Database scheduler started successfully');
      }
    } else if (finalConfig.runInitialSeed) {
      // Only run initial seeding if scheduler is not enabled
      if (finalConfig.verbose) {
        console.log('🌱 Running initial database seeding...');
      }
      
      await seedDatabase();
      
      if (finalConfig.verbose) {
        console.log('✅ Initial database seeding completed');
      }
    }

    if (finalConfig.verbose) {
      console.log('🎉 Database startup sequence completed!');
    }

  } catch (error) {
    console.error('❌ Database startup failed:', error);
    throw error;
  }
}

/**
 * Get the current scheduler instance
 */
export function getScheduler(): DatabaseScheduler | null {
  return globalScheduler;
}

/**
 * Stop the scheduler and close database connections
 */
export async function shutdownDatabase(): Promise<void> {
  try {
    if (globalScheduler) {
      console.log('🛑 Stopping database scheduler...');
      globalScheduler.stop();
      globalScheduler = null;
      console.log('✅ Database scheduler stopped');
    }

    console.log('🔌 Closing database connections...');
    await closeDatabase();
    console.log('✅ Database connections closed');

  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
    throw error;
  }
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(): void {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      
      try {
        await shutdownDatabase();
        console.log('👋 Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught Exception:', error);
    try {
      await shutdownDatabase();
    } catch (shutdownError) {
      console.error('❌ Error during emergency shutdown:', shutdownError);
    }
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    try {
      await shutdownDatabase();
    } catch (shutdownError) {
      console.error('❌ Error during emergency shutdown:', shutdownError);
    }
    process.exit(1);
  });
}

/**
 * Get scheduler status for health checks
 */
export function getSchedulerStatus() {
  if (!globalScheduler) {
    return {
      running: false,
      message: 'Scheduler not initialized'
    };
  }

  return globalScheduler.getStatus();
}