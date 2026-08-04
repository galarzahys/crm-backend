import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const TIPOS_IMAGEN_VALIDOS = ['image/jpeg', 'image/png', 'image/webp'];

export class SolicitarSubidaImagenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreArchivo: string;

  @IsIn(TIPOS_IMAGEN_VALIDOS)
  tipoArchivo: string;
}
