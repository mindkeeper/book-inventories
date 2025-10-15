import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('sentry-test')
  sentryTest() {
    throw new Error('Sentry Test Error - This is intentional for testing');
  }
}
