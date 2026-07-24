import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AtributosService } from './atributos.service';
import { GuardarAtributoDto } from './atributo.dto';

@Controller('atributos')
export class AtributosController {
  constructor(private readonly atributosService: AtributosService) {}

  @Get()
  listarConOpciones() {
    return this.atributosService.listarConOpciones();
  }

  @Post()
  crear(@Body() dto: GuardarAtributoDto) {
    return this.atributosService.crearConOpciones(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarAtributoDto) {
    return this.atributosService.actualizarConOpciones(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.atributosService.eliminar(id);
  }
}
