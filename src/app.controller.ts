import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('salud')
  salud() {
    return { estado: 'ok', fecha: new Date().toISOString() };
  }
}
