import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { CrearPresupuestoDto } from './presupuesto.dto';
import { PresupuestosService } from './presupuestos.service';

@Controller('presupuestos')
export class PresupuestosController {
  constructor(private readonly presupuestosService: PresupuestosService) {}

  @Get()
  listarTodos() {
    return this.presupuestosService.listarTodas();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestosService.obtenerPorId(id);
  }

  @Post()
  crear(@Body() dto: CrearPresupuestoDto) {
    return this.presupuestosService.crearConItems(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearPresupuestoDto) {
    return this.presupuestosService.actualizarConItems(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestosService.eliminar(id);
  }
}
