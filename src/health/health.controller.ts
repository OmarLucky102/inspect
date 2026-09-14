import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      message: 'server is health and runing!!',
      timestamp: new Date().toISOString(),
    };
  }
}
