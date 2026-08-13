import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { Moneda } from '../listas-precio/entities/lista-precio.entity';
import { TipoMaterial } from '../materiales/material.entity';
import { TipoServicio } from './entities/presupuesto.entity';

const SERVICIOS_VALIDOS: TipoServicio[] = ['venta_contenedores', 'alquiler_contenedores', 'modificacion', 'accesorios'];
const MONEDAS_VALIDAS: Moneda[] = ['ARS', 'USD'];
const TIPOS_MATERIAL_VALIDOS: TipoMaterial[] = ['material', 'estructural', 'insumos', 'accesorio', 'mano_obra'];

/** Una entrada del costo (por unidad) de un ítem, congelada al momento de agregarlo. */
export class CostoDetalladoItemDto {
  @IsIn(TIPOS_MATERIAL_VALIDOS)
  tipo: TipoMaterial;

  @IsIn(MONEDAS_VALIDAS)
  moneda: Moneda;

  @IsNumber()
  @Min(0)
  total: number;
}

export class PresupuestoItemDto {
  @IsInt()
  articuloId: number;

  @IsInt()
  listaPrecioId: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsIn(MONEDAS_VALIDAS)
  moneda: Moneda;

  @IsInt()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @Min(0)
  descuentoPorcentaje: number;

  @IsNumber()
  @Min(0)
  descuentoValor: number;

  /** Costo por unidad, discriminado por tipo/moneda, congelado al momento de agregar el ítem. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostoDetalladoItemDto)
  costoDetallado?: CostoDetalladoItemDto[];
}

export class CrearPresupuestoDto {
  @IsInt()
  clienteId: number;

  @IsInt()
  vendedorId: number;

  @IsIn(SERVICIOS_VALIDOS)
  servicio: TipoServicio;

  @IsInt()
  @IsPositive()
  plazoValidezDias: number;

  @IsInt()
  listaPrecioId: number;

  @IsNumber()
  @Min(0)
  descuentoGeneralPorcentaje: number;

  @IsNumber()
  @Min(0)
  descuentoGeneralValor: number;

  /** Cotización del dólar del día (1 USD = X ARS), para el desglose de costos. */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  cotizacionDolar?: number | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PresupuestoItemDto)
  items: PresupuestoItemDto[];
}
