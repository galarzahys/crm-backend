import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { DefinirCostoMaterialDto, GuardarMaterialDto } from './material.dto';
import { Material, MaterialCosto, MaterialCostoHistorial } from './material.entity';

/** Material junto con su costo vigente (si ya se definió), para simplificar la UI. */
export interface MaterialConCosto extends Material {
  costoActual: MaterialCosto | null;
}

@Injectable()
export class MaterialesService extends CrudService<Material> {
  constructor(
    @InjectRepository(Material) repositorio: Repository<Material>,
    @InjectRepository(MaterialCosto) private readonly repositorioCosto: Repository<MaterialCosto>,
    @InjectRepository(MaterialCostoHistorial) private readonly repositorioHistorial: Repository<MaterialCostoHistorial>,
  ) {
    super(repositorio, 'material');
  }

  async listarConCosto(busqueda?: string, tipo?: string): Promise<MaterialConCosto[]> {
    const qb = this.repositorio.createQueryBuilder('material').where('material.activo = :activo', { activo: true });

    if (busqueda) {
      qb.andWhere('material.nombre LIKE :busqueda', { busqueda: `%${busqueda}%` });
    }
    if (tipo) {
      qb.andWhere('material.tipo = :tipo', { tipo });
    }
    qb.orderBy('material.nombre', 'ASC');

    const materiales = await qb.getMany();
    if (materiales.length === 0) {
      return [];
    }

    const costos = await this.repositorioCosto.find({
      where: { activo: true },
    });
    const costoPorMaterial = new Map(costos.map((costo) => [costo.materialId, costo]));

    return materiales.map((material) => ({ ...material, costoActual: costoPorMaterial.get(material.id) ?? null }));
  }

  async guardarMaterial(dto: GuardarMaterialDto): Promise<Material> {
    return this.crear({ nombre: dto.nombre, tipo: dto.tipo, unidadMedida: dto.unidadMedida });
  }

  async actualizarMaterial(id: number, dto: GuardarMaterialDto): Promise<Material> {
    return this.actualizar(id, { nombre: dto.nombre, tipo: dto.tipo, unidadMedida: dto.unidadMedida });
  }

  async obtenerCosto(materialId: number): Promise<MaterialCosto | null> {
    return this.repositorioCosto.findOne({ where: { materialId, activo: true } });
  }

  /** Historial de valores reemplazados de un material, del más reciente al más antiguo. */
  async historialDeCosto(materialId: number): Promise<MaterialCostoHistorial[]> {
    return this.repositorioHistorial.find({
      where: { materialId },
      order: { vigenteHasta: 'DESC' },
    });
  }

  /**
   * Define (da de alta o actualiza) el costo vigente de un material. Si ya
   * había un valor vigente, lo pasa a `materiales_costo_historial` (con su
   * fecha de vigencia original y `vigenteHasta` = ahora) antes de grabar el
   * valor nuevo — mismo criterio que `PreciosArticuloService.definirValor`.
   */
  async definirCosto(materialId: number, dto: DefinirCostoMaterialDto): Promise<MaterialCosto> {
    const actual = await this.obtenerCosto(materialId);
    const ahora = new Date();

    if (!actual) {
      const nuevo = this.repositorioCosto.create({
        materialId,
        moneda: dto.moneda,
        valor: dto.valor,
        vigenteDesde: ahora,
        activo: true,
      });
      return this.repositorioCosto.save(nuevo);
    }

    const historico = this.repositorioHistorial.create({
      materialId,
      moneda: actual.moneda,
      valor: actual.valor,
      vigenteDesde: actual.vigenteDesde,
      vigenteHasta: ahora,
      activo: true,
    });
    await this.repositorioHistorial.save(historico);

    actual.moneda = dto.moneda;
    actual.valor = dto.valor;
    actual.vigenteDesde = ahora;
    return this.repositorioCosto.save(actual);
  }
}
