import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { GuardarCategoriaMaterialDto } from './categoria-material.dto';
import { CategoriaMaterial } from './categoria-material.entity';

@Injectable()
export class CategoriasMaterialService extends CrudService<CategoriaMaterial> {
  constructor(@InjectRepository(CategoriaMaterial) repositorio: Repository<CategoriaMaterial>) {
    super(repositorio, 'categoria');
  }

  async guardarCategoria(dto: GuardarCategoriaMaterialDto): Promise<CategoriaMaterial> {
    // Una categoría recién creada no puede formar parte de ningún ciclo
    // todavía (nada puede referenciarla de antes), así que acá no hace
    // falta validar — sí hace falta al editar (ver más abajo).
    return this.crear({ nombre: dto.nombre, padreId: dto.padreId ?? null });
  }

  async actualizarCategoria(id: number, dto: GuardarCategoriaMaterialDto): Promise<CategoriaMaterial> {
    if (dto.padreId != null) {
      if (dto.padreId === id) {
        throw new BadRequestException('Una categoría no puede ser su propia categoría padre.');
      }
      const generariaCiclo = await this.esDescendiente(id, dto.padreId);
      if (generariaCiclo) {
        throw new BadRequestException(
          'Esa categoría ya es descendiente de esta — no se puede usar como padre (generaría un ciclo).',
        );
      }
    }
    return this.actualizar(id, { nombre: dto.nombre, padreId: dto.padreId ?? null });
  }

  /**
   * Ids de `categoriaId` + todas sus descendientes (recursivo, cualquier
   * profundidad). Lo usa el ajuste masivo de costo: al elegir una
   * categoría, el % se aplica a los materiales de esta categoría y de
   * todas las que cuelguen de ella.
   */
  async obtenerIdsConDescendientes(categoriaId: number): Promise<number[]> {
    const ids = [categoriaId];
    const hijos = await this.repositorio.find({ where: { padreId: categoriaId, activo: true } as any });
    for (const hijo of hijos) {
      ids.push(...(await this.obtenerIdsConDescendientes(hijo.id)));
    }
    return ids;
  }

  /** ¿`posibleDescendienteId` es descendiente (directo o indirecto) de `raizId`? */
  private async esDescendiente(raizId: number, posibleDescendienteId: number, visitados: Set<number> = new Set()): Promise<boolean> {
    if (raizId === posibleDescendienteId) {
      return true;
    }
    if (visitados.has(raizId)) {
      return false;
    }
    visitados.add(raizId);

    const hijos = await this.repositorio.find({ where: { padreId: raizId, activo: true } as any });
    for (const hijo of hijos) {
      if (await this.esDescendiente(hijo.id, posibleDescendienteId, visitados)) {
        return true;
      }
    }
    return false;
  }
}
