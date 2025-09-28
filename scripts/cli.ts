#!/usr/bin/env node

import { seedDatabase, wipeDatabase } from './seed-database';
import { scheduler } from './scheduler';

const commands = {
  seed: {
    description: 'Run database seeding once',
    action: async () => {
      console.log('🌱 Running manual database seeding...');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
    }
  },
  wipe: {
    description: 'Wipe database (remove all data)',
    action: async () => {
      console.log('🗑️  Running manual database wipe...');
      await wipeDatabase();
      console.log('✅ Database wiped successfully');
    }
  },
  start: {
    description: 'Start the hourly scheduler',
    action: async () => {
      console.log('🚀 Starting scheduler...');
      scheduler.start();
      
      // Keep the process alive
      console.log('💡 Scheduler is running. Press Ctrl+C to stop.');
      process.stdin.resume();
    }
  },
  status: {
    description: 'Show scheduler status',
    action: async () => {
      scheduler.printStatus();
    }
  },
  help: {
    description: 'Show this help message',
    action: async () => {
      console.log('\n📚 Database Management CLI');
      console.log('Usage: npm run db:cli <command>\n');
      console.log('Available commands:');
      
      Object.entries(commands).forEach(([cmd, info]) => {
        console.log(`  ${cmd.padEnd(10)} - ${info.description}`);
      });
      
      console.log('\nExamples:');
      console.log('  npm run db:cli seed     # Run seeding once');
      console.log('  npm run db:cli start    # Start hourly scheduler');
      console.log('  npm run db:cli status   # Check scheduler status');
      console.log('  npm run db:cli wipe     # Wipe all data');
    }
  }
};

async function main() {
  const command = process.argv[2];
  
  if (!command || !commands[command as keyof typeof commands]) {
    console.log('❌ Invalid or missing command');
    await commands.help.action();
    process.exit(1);
  }
  
  try {
    await commands[command as keyof typeof commands].action();
  } catch (error) {
    console.error('💥 Command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this script is executed directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('cli.ts');
if (isMainModule) {
  main();
}

export { commands };