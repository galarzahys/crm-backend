import { Controller, Get } from '@nestjs/common';
import { VendedoresService } from './vendedores.service';

@Controller('vendedores')
export class VendedoresController {
  constructor(private readonly vendedoresService: VendedoresService) {}

  @Get()
  listarTodos() {
    return this.vendedoresService.listarTodas();
  }
}
