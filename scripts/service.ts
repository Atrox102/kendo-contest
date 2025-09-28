#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { scheduler } from './scheduler';

// Production configuration
const PRODUCTION_CONFIG = {
  logFile: path.join(process.cwd(), 'logs', 'database-scheduler.log'),
  errorLogFile: path.join(process.cwd(), 'logs', 'database-scheduler-error.log'),
  pidFile: path.join(process.cwd(), 'logs', 'database-scheduler.pid'),
  enableFileLogging: true,
  logRotationSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5
};

class ProductionService {
  private logStream: fs.WriteStream | null = null;
  private errorLogStream: fs.WriteStream | null = null;

  constructor() {
    this.setupLogging();
    this.setupProcessHandlers();
    this.writePidFile();
  }

  private setupLogging() {
    if (!PRODUCTION_CONFIG.enableFileLogging) return;

    // Ensure logs directory exists
    const logsDir = path.dirname(PRODUCTION_CONFIG.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Setup log streams
    this.logStream = fs.createWriteStream(PRODUCTION_CONFIG.logFile, { flags: 'a' });
    this.errorLogStream = fs.createWriteStream(PRODUCTION_CONFIG.errorLogFile, { flags: 'a' });

    // Override console methods to write to files
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] ${message}\n`;
      
      originalLog(...args);
      if (this.logStream) {
        this.logStream.write(logLine);
      }
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] ERROR: ${message}\n`;
      
      originalError(...args);
      if (this.errorLogStream) {
        this.errorLogStream.write(logLine);
      }
    };

    this.log('📝 File logging enabled');
    this.log(`📄 Log file: ${PRODUCTION_CONFIG.logFile}`);
    this.log(`📄 Error log file: ${PRODUCTION_CONFIG.errorLogFile}`);
  }

  private setupProcessHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.cleanup();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.cleanup();
      process.exit(1);
    });

    // Handle graceful shutdown signals
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      this.shutdown();
    });

    // Handle Windows specific signals
    if (process.platform === 'win32') {
      process.on('SIGBREAK', () => {
        console.log('\n🛑 Received SIGBREAK, shutting down gracefully...');
        this.shutdown();
      });
    }
  }

  private writePidFile() {
    try {
      const logsDir = path.dirname(PRODUCTION_CONFIG.pidFile);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(PRODUCTION_CONFIG.pidFile, process.pid.toString());
      this.log(`📋 PID file written: ${PRODUCTION_CONFIG.pidFile} (PID: ${process.pid})`);
    } catch (error) {
      console.error('❌ Failed to write PID file:', error);
    }
  }

  private cleanup() {
    try {
      // Close log streams
      if (this.logStream) {
        this.logStream.end();
      }
      if (this.errorLogStream) {
        this.errorLogStream.end();
      }

      // Remove PID file
      if (fs.existsSync(PRODUCTION_CONFIG.pidFile)) {
        fs.unlinkSync(PRODUCTION_CONFIG.pidFile);
        console.log('🗑️  PID file removed');
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  private shutdown() {
    console.log('🔄 Stopping scheduler...');
    scheduler.stop();
    
    console.log('🧹 Cleaning up...');
    this.cleanup();
    
    console.log('✅ Service stopped gracefully');
    process.exit(0);
  }

  private log(message: string) {
    console.log(message);
  }

  start() {
    this.log('🚀 Starting Database Scheduler Service');
    this.log(`🆔 Process ID: ${process.pid}`);
    this.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    this.log(`📁 Working Directory: ${process.cwd()}`);
    
    // Start the scheduler
    scheduler.start();
    
    this.log('✅ Service started successfully');
    this.log('💡 Service is running in the background');
    
    // Print status periodically
    setInterval(() => {
      scheduler.printStatus();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  static isRunning(): boolean {
    try {
      if (!fs.existsSync(PRODUCTION_CONFIG.pidFile)) {
        return false;
      }
      
      const pid = parseInt(fs.readFileSync(PRODUCTION_CONFIG.pidFile, 'utf8'));
      
      // Check if process is still running
      try {
        process.kill(pid, 0); // Signal 0 checks if process exists
        return true;
      } catch {
        // Process doesn't exist, remove stale PID file
        fs.unlinkSync(PRODUCTION_CONFIG.pidFile);
        return false;
      }
    } catch {
      return false;
    }
  }

  static stop(): boolean {
    try {
      if (!fs.existsSync(PRODUCTION_CONFIG.pidFile)) {
        console.log('❌ Service is not running (no PID file found)');
        return false;
      }
      
      const pid = parseInt(fs.readFileSync(PRODUCTION_CONFIG.pidFile, 'utf8'));
      
      console.log(`🛑 Stopping service (PID: ${pid})...`);
      process.kill(pid, 'SIGTERM');
      
      // Wait a bit and check if it stopped
      setTimeout(() => {
        if (!ProductionService.isRunning()) {
          console.log('✅ Service stopped successfully');
        } else {
          console.log('⚠️  Service may still be running');
        }
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to stop service:', error);
      return false;
    }
  }

  static status() {
    const isRunning = ProductionService.isRunning();
    
    console.log('\n📊 Database Scheduler Service Status:');
    console.log(`   • Status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);
    
    if (isRunning) {
      const pid = fs.readFileSync(PRODUCTION_CONFIG.pidFile, 'utf8');
      console.log(`   • PID: ${pid}`);
      console.log(`   • PID File: ${PRODUCTION_CONFIG.pidFile}`);
    }
    
    console.log(`   • Log File: ${PRODUCTION_CONFIG.logFile}`);
    console.log(`   • Error Log: ${PRODUCTION_CONFIG.errorLogFile}`);
    
    // Show recent logs if available
    if (fs.existsSync(PRODUCTION_CONFIG.logFile)) {
      try {
        const logContent = fs.readFileSync(PRODUCTION_CONFIG.logFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        const recentLines = lines.slice(-5);
        
        if (recentLines.length > 0) {
          console.log('\n📄 Recent Log Entries:');
          recentLines.forEach(line => console.log(`   ${line}`));
        }
      } catch (error) {
        console.log('   ⚠️  Could not read log file');
      }
    }
  }
}

// CLI handling
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      if (ProductionService.isRunning()) {
        console.log('⚠️  Service is already running');
        ProductionService.status();
        process.exit(1);
      }
      
      const service = new ProductionService();
      service.start();
      break;
      
    case 'stop':
      ProductionService.stop();
      break;
      
    case 'restart':
      console.log('🔄 Restarting service...');
      ProductionService.stop();
      setTimeout(() => {
        const service = new ProductionService();
        service.start();
      }, 3000);
      break;
      
    case 'status':
      ProductionService.status();
      break;
      
    default:
      console.log('\n🛠️  Database Scheduler Service');
      console.log('Usage: npm run db:service <command>\n');
      console.log('Commands:');
      console.log('  start    - Start the service');
      console.log('  stop     - Stop the service');
      console.log('  restart  - Restart the service');
      console.log('  status   - Show service status');
      break;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ProductionService, PRODUCTION_CONFIG };