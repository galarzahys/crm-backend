import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginacionQueryDto } from '../../common/dto/paginacion-query.dto';

export class AtributoAsignadoDto {
  @IsInt()
  atributoId: number;

  @IsOptional()
  @IsString()
  valorLibre?: string | null;

  @IsOptional()
  @IsInt()
  opcionId?: number | null;
}

export class ComponenteAsignadoDto {
  @IsInt()
  materialId: number;

  @IsNumber()
  @IsPositive()
  cantidad: number;
}

/** Mano de obra usada como componente de costo de este artículo. */
export class ManoDeObraAsignadaDto {
  @IsInt()
  manoDeObraId: number;

  @IsNumber()
  @IsPositive()
  cantidad: number;
}

/** Otro artículo usado como componente de costo de este ("subartículo"). */
export class SubarticuloAsignadoDto {
  @IsInt()
  subarticuloId: number;

  @IsNumber()
  @IsPositive()
  cantidad: number;
}

export class GuardarArticuloDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcionInterna?: string;

  @IsOptional()
  @IsString()
  descripcionComprador?: string;

  @IsInt()
  categoriaId: number;

  @IsOptional()
  @IsString()
  imagenKey?: string | null;

  @IsOptional()
  @IsString()
  imagenUrlVisualizacion?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtributoAsignadoDto)
  atributos?: AtributoAsignadoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponenteAsignadoDto)
  componentes?: ComponenteAsignadoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManoDeObraAsignadaDto)
  manoDeObra?: ManoDeObraAsignadaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubarticuloAsignadoDto)
  subarticulos?: SubarticuloAsignadoDto[];
}

export class ListarArticulosQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number;
}
