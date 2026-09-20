import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async status() {
    try {
      await this.database.query('SELECT 1');
      return { success: true, data: { status: 'ok', database: 'connected' }, message: null, meta: {} };
    } catch {
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }
}
