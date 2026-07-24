import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';
import { Moneda } from '../listas-precio/entities/lista-precio.entity';

export type TipoMaterial = 'material' | 'mano_obra' | 'accesorio' | 'insumos' | 'estructural';

/**
 * Material, mano de obra o accesorio que se puede usar como componente de
 * costo de un artículo (ver `ArticuloComponente` en el módulo de
 * artículos). Tabla `materiales` en el esquema relacional.
 */
@Entity('materiales')
export class Material extends EntidadBase {
  @Column()
  nombre: string;

  @Column({ type: 'varchar' })
  tipo: TipoMaterial;

  /** Ej: "kg", "m2", "hora", "unidad". Texto libre, igual que `unidadMedida` en Atributo. */
  @Column({ name: 'unidad_medida' })
  unidadMedida: string;
}

/**
 * Costo **vigente** por unidad de medida de un material. Un solo registro
 * activo por material a la vez. Cuando se redefine, el valor anterior se
 * copia a `MaterialCostoHistorial` antes de pisarlo (mismo criterio que
 * `PrecioArticulo`/`PrecioArticuloHistorial` en listas de precio).
 * Tabla `materiales_costo`.
 */
@Entity('materiales_costo')
export class MaterialCosto extends EntidadBase {
  @Column({ name: 'material_id' })
  materialId: number;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  /** Más decimales que un precio de venta: el costo por unidad puede ser chico (ej: costo por gramo). */
  @Column({ type: 'decimal', precision: 14, scale: 4 })
  valor: number;

  @Column({ name: 'vigente_desde', type: 'datetime' })
  vigenteDesde: Date;
}

/** Costo histórico (ya reemplazado) de un material. Tabla `materiales_costo_historial`. */
@Entity('materiales_costo_historial')
export class MaterialCostoHistorial extends EntidadBase {
  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  valor: number;

  /** Fecha desde la que ese valor había regido. */
  @Column({ name: 'vigente_desde', type: 'datetime' })
  vigenteDesde: Date;

  /** Fecha en la que pasó a historial (fue reemplazado por un valor nuevo). */
  @Column({ name: 'vigente_hasta', type: 'datetime' })
  vigenteHasta: Date;
}
