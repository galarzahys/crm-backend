import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearCategoriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;
}

export class ActualizarCategoriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;
}
