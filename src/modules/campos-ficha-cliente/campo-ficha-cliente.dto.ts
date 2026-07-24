import { IsBoolean, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TipoCampoFicha } from './campo-ficha-cliente.entity';

const TIPOS_VALIDOS: TipoCampoFicha[] = ['texto', 'numero', 'fecha', 'email', 'telefono'];

export class GuardarCampoFichaClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsIn(TIPOS_VALIDOS)
  tipo: TipoCampoFicha;

  @IsBoolean()
  obligatorio: boolean;

  @IsBoolean()
  esBuscador: boolean;
}
