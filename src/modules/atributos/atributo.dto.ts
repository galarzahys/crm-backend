import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoAtributo } from './entities/atributo.entity';

export class GuardarAtributoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unidadMedida?: string | null;

  @IsIn(['libre', 'opciones'])
  tipo: TipoAtributo;

  /** Textos de las opciones (solo se usan si `tipo === 'opciones'`); reemplazan a las anteriores. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => String)
  opciones?: string[];
}
