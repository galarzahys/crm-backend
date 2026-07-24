import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
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
}

export class ListarArticulosQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number;
}
