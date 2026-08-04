import { Body, Controller, Delete, Post, Query } from '@nestjs/common';
import { SolicitarSubidaImagenDto } from './imagenes.dto';
import { ImagenesService } from './imagenes.service';

@Controller('imagenes')
export class ImagenesController {
  constructor(private readonly imagenesService: ImagenesService) {}

  @Post('url-subida')
  solicitarUrlSubida(@Body() dto: SolicitarSubidaImagenDto) {
    return this.imagenesService.solicitarUrlSubida(dto);
  }

  /** `key` va por query param (no por path) porque contiene barras ("articulos/..."). */
  @Delete()
  eliminar(@Query('key') key: string) {
    return this.imagenesService.eliminar(key);
  }
}
