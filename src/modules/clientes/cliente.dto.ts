import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

export class ValorCampoClienteDto {
  @IsInt()
  campoId: number;

  @IsString()
  valor: string;
}

export class GuardarClienteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValorCampoClienteDto)
  valores: ValorCampoClienteDto[];
}
