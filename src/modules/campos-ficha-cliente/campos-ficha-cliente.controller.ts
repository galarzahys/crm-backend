import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { GuardarCampoFichaClienteDto } from './campo-ficha-cliente.dto';
import { CamposFichaClienteService } from './campos-ficha-cliente.service';

@Controller('campos-ficha-cliente')
export class CamposFichaClienteController {
  constructor(private readonly camposFichaClienteService: CamposFichaClienteService) {}

  @Get()
  listarTodos() {
    return this.camposFichaClienteService.listarTodas();
  }

  @Post()
  crear(@Body() dto: GuardarCampoFichaClienteDto) {
    return this.camposFichaClienteService.crearCampo(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarCampoFichaClienteDto) {
    return this.camposFichaClienteService.actualizarCampo(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.camposFichaClienteService.eliminar(id);
  }
}
