import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Queen Hills API is running',
        database: 'connected',
        databaseType: this.dataSource.options.type,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
        database: 'disconnected',
        error: error.message,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      };
    }
  }
} 