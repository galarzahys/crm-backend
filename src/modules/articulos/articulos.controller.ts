import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ArticulosService } from './articulos.service';
import { GuardarArticuloDto, ListarArticulosQueryDto } from './articulo.dto';

@Controller('articulos')
export class ArticulosController {
  constructor(private readonly articulosService: ArticulosService) {}

  @Get()
  listar(@Query() query: ListarArticulosQueryDto) {
    return this.articulosService.listarFiltrado(query);
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.articulosService.obtenerPorId(id);
  }

  /** Costo total recursivo (materiales directos + subartículos), agrupado por moneda. */
  @Get(':id/costo-total')
  costoTotal(@Param('id', ParseIntPipe) id: number) {
    return this.articulosService.calcularCostoTotal(id);
  }

  @Post()
  crear(@Body() dto: GuardarArticuloDto) {
    return this.articulosService.crearConAtributos(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarArticuloDto) {
    return this.articulosService.actualizarConAtributos(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.articulosService.eliminar(id);
  }
}
