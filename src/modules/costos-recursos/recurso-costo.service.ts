import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefinirCostoRecursoDto } from './recurso-costo.dto';
import { RecursoCosto, RecursoCostoHistorial, TipoRecurso } from './recurso-costo.entity';

@Injectable()
export class RecursoCostoService {
  constructor(
    @InjectRepository(RecursoCosto) private readonly repositorio: Repository<RecursoCosto>,
    @InjectRepository(RecursoCostoHistorial) private readonly repositorioHistorial: Repository<RecursoCostoHistorial>,
  ) {}

  async obtenerCosto(tipoRecurso: TipoRecurso, recursoId: number): Promise<RecursoCosto | null> {
    return this.repositorio.findOne({ where: { tipoRecurso, recursoId, activo: true } });
  }

  /** Costos vigentes de varios recursos del mismo tipo a la vez (para listados, sin N+1). */
  async obtenerCostosDe(tipoRecurso: TipoRecurso, recursoIds: number[]): Promise<Map<number, RecursoCosto>> {
    if (recursoIds.length === 0) {
      return new Map();
    }
    const costos = await this.repositorio
      .createQueryBuilder('costo')
      .where('costo.tipoRecurso = :tipoRecurso', { tipoRecurso })
      .andWhere('costo.recursoId IN (:...ids)', { ids: recursoIds })
      .andWhere('costo.activo = :activo', { activo: true })
      .getMany();
    return new Map(costos.map((costo) => [costo.recursoId, costo]));
  }

  async historialDe(tipoRecurso: TipoRecurso, recursoId: number): Promise<RecursoCostoHistorial[]> {
    return this.repositorioHistorial.find({
      where: { tipoRecurso, recursoId },
      order: { vigenteHasta: 'DESC' },
    });
  }

  /**
   * Define (da de alta o actualiza) el costo vigente de un recurso. Si ya
   * había un valor vigente, lo pasa a `recursos_costo_historial` (con su
   * fecha de vigencia original y `vigenteHasta` = ahora) antes de grabar
   * el valor nuevo.
   */
  async definirCosto(tipoRecurso: TipoRecurso, recursoId: number, dto: DefinirCostoRecursoDto): Promise<RecursoCosto> {
    const actual = await this.obtenerCosto(tipoRecurso, recursoId);
    const ahora = new Date();

    if (!actual) {
      const nuevo = this.repositorio.create({
        tipoRecurso,
        recursoId,
        moneda: dto.moneda,
        valor: dto.valor,
        vigenteDesde: ahora,
        activo: true,
      });
      return this.repositorio.save(nuevo);
    }

    const historico = this.repositorioHistorial.create({
      tipoRecurso,
      recursoId,
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
    return this.repositorio.save(actual);
  }

  /**
   * Aplica un % de ajuste (positivo = aumento, negativo = disminución)
   * sobre el costo vigente de varios recursos a la vez, cada uno en su
   * propia moneda actual. Cada uno pasa por `definirCosto` — o sea, cada
   * uno genera su propia entrada de historial, como si se hubiera
   * editado a mano. Los recursos sin costo vigente se ignoran (no hay
   * base sobre la que aplicar el %).
   */
  async ajustarCostoPorcentaje(
    tipoRecurso: TipoRecurso,
    recursoIds: number[],
    porcentaje: number,
  ): Promise<{ actualizados: number; sinCosto: number }> {
    let actualizados = 0;
    let sinCosto = 0;

    for (const recursoId of recursoIds) {
      const actual = await this.obtenerCosto(tipoRecurso, recursoId);
      if (!actual) {
        sinCosto += 1;
        continue;
      }
      const nuevoValor = Math.round((actual.valor * (1 + porcentaje / 100) + Number.EPSILON) * 10000) / 10000;
      await this.definirCosto(tipoRecurso, recursoId, { moneda: actual.moneda, valor: Math.max(nuevoValor, 0.0001) });
      actualizados += 1;
    }

    return { actualizados, sinCosto };
  }
}
