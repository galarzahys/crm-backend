import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { DefinirValorDto, GuardarListaPrecioDto } from './lista-precio.dto';
import { ListasPrecioService } from './listas-precio.service';
import { PreciosArticuloService } from './precios-articulo.service';

@Controller('listas-precio')
export class ListasPrecioController {
  constructor(
    private readonly listasPrecioService: ListasPrecioService,
    private readonly preciosArticuloService: PreciosArticuloService,
  ) {}

  @Get()
  listarTodas() {
    return this.listasPrecioService.listarTodas();
  }

  @Post()
  crear(@Body() dto: GuardarListaPrecioDto) {
    return this.listasPrecioService.crear(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarListaPrecioDto) {
    return this.listasPrecioService.actualizar(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.listasPrecioService.eliminar(id);
  }

  @Get(':id/precios')
  listarPrecios(@Param('id', ParseIntPipe) id: number) {
    return this.preciosArticuloService.listarVigentesDeLista(id);
  }

  @Put(':id/precios/:articuloId')
  definirValor(
    @Param('id', ParseIntPipe) id: number,
    @Param('articuloId', ParseIntPipe) articuloId: number,
    @Body() dto: DefinirValorDto,
  ) {
    return this.preciosArticuloService.definirValor(id, articuloId, dto);
  }

  @Get(':id/precios/:articuloId/historial')
  historial(@Param('id', ParseIntPipe) id: number, @Param('articuloId', ParseIntPipe) articuloId: number) {
    return this.preciosArticuloService.historialDe(id, articuloId);
  }
}
