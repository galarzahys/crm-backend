import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GuardarManoDeObraDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  unidadMedida: string;
}
