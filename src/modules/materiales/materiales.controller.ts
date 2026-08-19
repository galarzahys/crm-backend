import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { AjustarCostoPorcentajeDto, DefinirCostoRecursoDto } from '../costos-recursos/recurso-costo.dto';
import { GuardarMaterialDto } from './material.dto';
import { MaterialesService } from './materiales.service';

@Controller('materiales')
export class MaterialesController {
    constructor(private readonly materialesService: MaterialesService) { }

    @Get()
    listar(@Query('busqueda') busqueda?: string, @Query('categoriaId') categoriaId?: string) {
        return this.materialesService.listarConCosto(busqueda, categoriaId ? Number(categoriaId) : undefined);
    }

    @Post()
    crear(@Body() dto: GuardarMaterialDto) {
        return this.materialesService.guardarMaterial(dto);
    }

    // IMPORTANTE: esta ruta literal tiene que ir ANTES que '@Put(:id)' —
    // si no, Nest interpreta "ajustar-costo-por-categoria" como si fuera
    // el :id de un material y nunca llega hasta acá.
    /** Ajusta el costo vigente de los materiales de una o más categorías (y sus subcategorías), en %. */
    @Put('ajustar-costo-por-categoria')
    ajustarCostoPorCategoria(@Body() dto: AjustarCostoPorcentajeDto) {
        return this.materialesService.ajustarCostoPorCategoria(dto.categoriaIds, dto);
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
    definirCosto(@Param('id', ParseIntPipe) id: number, @Body() dto: DefinirCostoRecursoDto) {
        return this.materialesService.definirCosto(id, dto);
    }
}

