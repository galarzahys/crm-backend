import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { GuardarCategoriaMaterialDto } from './categoria-material.dto';
import { CategoriasMaterialService } from './categorias-material.service';

@Controller('categorias-material')
export class CategoriasMaterialController {
  constructor(private readonly categoriasMaterialService: CategoriasMaterialService) {}

  @Get()
  listarTodas() {
    return this.categoriasMaterialService.listarTodas();
  }

  @Post()
  crear(@Body() dto: GuardarCategoriaMaterialDto) {
    return this.categoriasMaterialService.guardarCategoria(dto);
  }

  @Put(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarCategoriaMaterialDto) {
    return this.categoriasMaterialService.actualizarCategoria(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasMaterialService.eliminar(id);
  }
}
