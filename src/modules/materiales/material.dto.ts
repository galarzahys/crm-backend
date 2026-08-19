import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GuardarMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsInt()
  categoriaId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  unidadMedida: string;
}
