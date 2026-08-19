import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';
import { Moneda } from '../listas-precio/entities/lista-precio.entity';

/**
 * Qué tipo de recurso está costeado: lo fija siempre el código (según qué
 * servicio invoque `RecursoCostoService`), nunca lo escribe el usuario a
 * mano — a propósito, para que la separación material/mano de obra sea
 * estructural y no dependa de un campo de texto libre (ver historial de
 * este proyecto: eso fue justo la causa de un bug feo).
 */
export type TipoRecurso = 'material' | 'mano_obra';

/**
 * Costo **vigente** por unidad de medida de un recurso (un material o una
 * mano de obra — `tipoRecurso` + `recursoId` identifican cuál). Un solo
 * registro activo por recurso a la vez; el valor anterior se copia a
 * `RecursoCostoHistorial` antes de pisarlo.
 *
 * Es la misma tabla para materiales y para mano de obra a propósito: es
 * exactamente el mismo concepto (costo por unidad, con historial), así que
 * no tiene sentido duplicar la lógica — lo que cambia es únicamente desde
 * dónde se la llama (`MaterialesService` vs `ManoDeObraService`, cada uno
 * fijando su propio `tipoRecurso`).
 */
@Entity('recursos_costo')
export class RecursoCosto extends EntidadBase {
  @Column({ name: 'tipo_recurso', type: 'varchar' })
  tipoRecurso: TipoRecurso;

  /** Id del material o de la mano de obra, según `tipoRecurso` (no es una FK real de la base, por ser polimórfico). */
  @Column({ name: 'recurso_id' })
  recursoId: number;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  valor: number;

  @Column({ name: 'vigente_desde', type: 'datetime' })
  vigenteDesde: Date;
}

/** Costo histórico (ya reemplazado) de un recurso. */
@Entity('recursos_costo_historial')
export class RecursoCostoHistorial extends EntidadBase {
  @Column({ name: 'tipo_recurso', type: 'varchar' })
  tipoRecurso: TipoRecurso;

  @Column({ name: 'recurso_id' })
  recursoId: number;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  valor: number;

  @Column({ name: 'vigente_desde', type: 'datetime' })
  vigenteDesde: Date;

  @Column({ name: 'vigente_hasta', type: 'datetime' })
  vigenteHasta: Date;
}
