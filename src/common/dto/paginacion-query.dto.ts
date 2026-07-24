import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Parámetros de consulta genéricos para listar entidades, en la misma
 * forma que `ParametrosConsulta` del frontend (`shared/models/parametros-consulta.model.ts`).
 */
export class PaginacionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pagina?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tamanio?: number = 10;

  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direccion?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsString()
  busqueda?: string;
}
