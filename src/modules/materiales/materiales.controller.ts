import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { DefinirCostoMaterialDto, GuardarMaterialDto } from './material.dto';
import { MaterialesService } from './materiales.service';

@Controller('materiales')
export class MaterialesController {
  constructor(private readonly materialesService: MaterialesService) {}

  @Get()
  listar(@Query('busqueda') busqueda?: string, @Query('tipo') tipo?: string) {
    return this.materialesService.listarConCosto(busqueda, tipo);
  }

  @Post()
  crear(@Body() dto: GuardarMaterialDto) {
    return this.materialesService.guardarMaterial(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarMaterialDto) {
    return this.materialesService.actualizarMaterial(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.materialesService.eliminar(id);
  }

  @Get(':id/costo')
  obtenerCosto(@Param('id', ParseIntPipe) id: number) {
    return this.materialesService.obtenerCosto(id);
  }

  @Get(':id/costo/historial')
  historialDeCosto(@Param('id', ParseIntPipe) id: number) {
    return this.materialesService.historialDeCosto(id);
  }

  @Put(':id/costo')
  definirCosto(@Param('id', ParseIntPipe) id: number, @Body() dto: DefinirCostoMaterialDto) {
    return this.materialesService.definirCosto(id, dto);
  }
}
