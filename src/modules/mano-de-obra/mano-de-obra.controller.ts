import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { DefinirCostoRecursoDto } from '../costos-recursos/recurso-costo.dto';
import { GuardarManoDeObraDto } from './mano-de-obra.dto';
import { ManoDeObraService } from './mano-de-obra.service';

@Controller('mano-de-obra')
export class ManoDeObraController {
  constructor(private readonly manoDeObraService: ManoDeObraService) {}

  @Get()
  listar(@Query('busqueda') busqueda?: string) {
    return this.manoDeObraService.listarConCosto(busqueda);
  }

  @Post()
  crear(@Body() dto: GuardarManoDeObraDto) {
    return this.manoDeObraService.guardarManoDeObra(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarManoDeObraDto) {
    return this.manoDeObraService.actualizarManoDeObra(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.manoDeObraService.eliminar(id);
  }

  @Get(':id/costo')
  obtenerCosto(@Param('id', ParseIntPipe) id: number) {
    return this.manoDeObraService.obtenerCosto(id);
  }

  @Get(':id/costo/historial')
  historialDeCosto(@Param('id', ParseIntPipe) id: number) {
    return this.manoDeObraService.historialDeCosto(id);
  }

  @Put(':id/costo')
  definirCosto(@Param('id', ParseIntPipe) id: number, @Body() dto: DefinirCostoRecursoDto) {
    return this.manoDeObraService.definirCosto(id, dto);
  }
}
