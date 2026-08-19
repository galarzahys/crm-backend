import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { DefinirCostoRecursoDto } from '../costos-recursos/recurso-costo.dto';
import { RecursoCosto } from '../costos-recursos/recurso-costo.entity';
import { RecursoCostoService } from '../costos-recursos/recurso-costo.service';
import { GuardarManoDeObraDto } from './mano-de-obra.dto';
import { ManoDeObra } from './mano-de-obra.entity';

/** Mano de obra junto con su costo vigente (si ya se definió). */
export interface ManoDeObraConCosto extends ManoDeObra {
  costoActual: RecursoCosto | null;
}

@Injectable()
export class ManoDeObraService extends CrudService<ManoDeObra> {
  constructor(
    @InjectRepository(ManoDeObra) repositorio: Repository<ManoDeObra>,
    private readonly recursoCostoService: RecursoCostoService,
  ) {
    super(repositorio, 'manoDeObra');
  }

  async listarConCosto(busqueda?: string): Promise<ManoDeObraConCosto[]> {
    const qb = this.repositorio.createQueryBuilder('manoDeObra').where('manoDeObra.activo = :activo', { activo: true });
    if (busqueda) {
      qb.andWhere('manoDeObra.nombre LIKE :busqueda', { busqueda: `%${busqueda}%` });
    }
    qb.orderBy('manoDeObra.nombre', 'ASC');

    const registros = await qb.getMany();
    if (registros.length === 0) {
      return [];
    }

    const costoPorRegistro = await this.recursoCostoService.obtenerCostosDe(
      'mano_obra',
      registros.map((r) => r.id),
    );

    return registros.map((registro) => ({ ...registro, costoActual: costoPorRegistro.get(registro.id) ?? null }));
  }

  async guardarManoDeObra(dto: GuardarManoDeObraDto): Promise<ManoDeObra> {
    return this.crear({ nombre: dto.nombre, unidadMedida: dto.unidadMedida });
  }

  async actualizarManoDeObra(id: number, dto: GuardarManoDeObraDto): Promise<ManoDeObra> {
    return this.actualizar(id, { nombre: dto.nombre, unidadMedida: dto.unidadMedida });
  }

  obtenerCosto(manoDeObraId: number) {
    return this.recursoCostoService.obtenerCosto('mano_obra', manoDeObraId);
  }

  historialDeCosto(manoDeObraId: number) {
    return this.recursoCostoService.historialDe('mano_obra', manoDeObraId);
  }

  definirCosto(manoDeObraId: number, dto: DefinirCostoRecursoDto) {
    return this.recursoCostoService.definirCosto('mano_obra', manoDeObraId, dto);
  }
}
