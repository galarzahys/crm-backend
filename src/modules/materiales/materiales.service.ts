import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { CategoriasMaterialService } from '../categorias-material/categorias-material.service';
import { AjustarCostoPorcentajeDto, DefinirCostoRecursoDto } from '../costos-recursos/recurso-costo.dto';
import { RecursoCosto } from '../costos-recursos/recurso-costo.entity';
import { RecursoCostoService } from '../costos-recursos/recurso-costo.service';
import { GuardarMaterialDto } from './material.dto';
import { Material } from './material.entity';

/** Material junto con su costo vigente (si ya se definió), para simplificar la UI. */
export interface MaterialConCosto extends Material {
  costoActual: RecursoCosto | null;
}

@Injectable()
export class MaterialesService extends CrudService<Material> {
  constructor(
    @InjectRepository(Material) repositorio: Repository<Material>,
    private readonly recursoCostoService: RecursoCostoService,
    private readonly categoriasMaterialService: CategoriasMaterialService,
  ) {
    super(repositorio, 'material');
  }

  async listarConCosto(busqueda?: string, categoriaId?: number): Promise<MaterialConCosto[]> {
    const qb = this.repositorio
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.categoria', 'categoria')
      .where('material.activo = :activo', { activo: true });

    if (busqueda) {
      qb.andWhere('material.nombre LIKE :busqueda', { busqueda: `%${busqueda}%` });
    }
    if (categoriaId) {
      qb.andWhere('material.categoriaId = :categoriaId', { categoriaId });
    }
    qb.orderBy('material.nombre', 'ASC');

    const materiales = await qb.getMany();
    if (materiales.length === 0) {
      return [];
    }

    const costoPorMaterial = await this.recursoCostoService.obtenerCostosDe(
      'material',
      materiales.map((m) => m.id),
    );

    return materiales.map((material) => ({ ...material, costoActual: costoPorMaterial.get(material.id) ?? null }));
  }

  async guardarMaterial(dto: GuardarMaterialDto): Promise<Material> {
    return this.crear({ nombre: dto.nombre, categoriaId: dto.categoriaId, unidadMedida: dto.unidadMedida });
  }

  async actualizarMaterial(id: number, dto: GuardarMaterialDto): Promise<Material> {
    return this.actualizar(id, { nombre: dto.nombre, categoriaId: dto.categoriaId, unidadMedida: dto.unidadMedida });
  }

  obtenerCosto(materialId: number) {
    return this.recursoCostoService.obtenerCosto('material', materialId);
  }

  historialDeCosto(materialId: number) {
    return this.recursoCostoService.historialDe('material', materialId);
  }

  definirCosto(materialId: number, dto: DefinirCostoRecursoDto) {
    return this.recursoCostoService.definirCosto('material', materialId, dto);
  }

  /**
   * Aplica un % de ajuste al costo vigente de todos los materiales de una
   * o más categorías **y de todas sus subcategorías** (recursivo — ver
   * `CategoriasMaterialService.obtenerIdsConDescendientes`). Si dos
   * categorías elegidas se superponen (una es ancestro de la otra), los
   * materiales no se duplican ni se ajustan dos veces.
   */
  async ajustarCostoPorCategoria(categoriaIds: number[], dto: AjustarCostoPorcentajeDto) {
    const idsCategoriasSet = new Set<number>();
    for (const categoriaId of categoriaIds) {
      const descendientes = await this.categoriasMaterialService.obtenerIdsConDescendientes(categoriaId);
      descendientes.forEach((id) => idsCategoriasSet.add(id));
    }

    const materiales = await this.repositorio
      .createQueryBuilder('material')
      .where('material.categoriaId IN (:...ids)', { ids: Array.from(idsCategoriasSet) })
      .andWhere('material.activo = :activo', { activo: true })
      .getMany();
    return this.recursoCostoService.ajustarCostoPorcentaje(
      'material',
      materiales.map((m) => m.id),
      dto.porcentaje,
    );
  }
}
