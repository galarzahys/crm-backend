import { IsIn, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';
import { Moneda } from '../listas-precio/entities/lista-precio.entity';
import { TipoMaterial } from './material.entity';

const TIPOS_VALIDOS: TipoMaterial[] = ['material', 'mano_obra', 'accesorio', 'insumos', 'estructural'];

export class GuardarMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsIn(TIPOS_VALIDOS)
  tipo: TipoMaterial;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  unidadMedida: string;
}

export class DefinirCostoMaterialDto {
  @IsIn(['ARS', 'USD'])
  moneda: Moneda;

  @IsNumber()
  @IsPositive()
  valor: number;
}
