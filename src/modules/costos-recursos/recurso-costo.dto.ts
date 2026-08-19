import { ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsPositive } from 'class-validator';
import { Moneda } from '../listas-precio/entities/lista-precio.entity';

export class DefinirCostoRecursoDto {
  @IsIn(['ARS', 'USD'])
  moneda: Moneda;

  @IsNumber()
  @IsPositive()
  valor: number;
}

/** Ajuste masivo de costo sobre una o más categorías (y sus subcategorías) a la vez, en %. */
export class AjustarCostoPorcentajeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  categoriaIds: number[];

  /** Positivo = aumento, negativo = disminución. */
  @IsNumber()
  porcentaje: number;
}
