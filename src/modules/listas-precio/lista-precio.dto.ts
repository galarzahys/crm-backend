import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { Moneda } from './entities/lista-precio.entity';

export class GuardarListaPrecioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;
}

export class DefinirValorDto {
  @IsIn(['ARS', 'USD'])
  moneda: Moneda;

  @IsNumber()
  @IsPositive()
  valor: number;
}
