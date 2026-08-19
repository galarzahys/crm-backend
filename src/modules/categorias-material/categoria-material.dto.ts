import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GuardarCategoriaMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  /** Categoría padre (opcional) — permite anidar categorías a cualquier profundidad. */
  @IsOptional()
  @IsInt()
  padreId?: number | null;
}
