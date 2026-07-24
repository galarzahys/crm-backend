import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
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
}
