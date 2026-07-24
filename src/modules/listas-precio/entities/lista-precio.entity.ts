import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../../../common/entities/entidad-base.entity';

export type Moneda = 'ARS' | 'USD';

@Entity('listas_precio')
export class ListaPrecio extends EntidadBase {
  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;
}

/**
 * Valor de venta **vigente** de un artículo en una lista. Un solo registro
 * activo por (listaPrecioId, articuloId) a la vez: cuando se redefine el
 * valor, el anterior se copia a `PrecioArticuloHistorial` antes de
 * pisarlo (ver `listas-precio.service.ts`).
 */
@Entity('precios_articulo')
export class PrecioArticulo extends EntidadBase {
  @Column({ name: 'lista_precio_id' })
  listaPrecioId: number;

  @Column({ name: 'articulo_id' })
  articuloId: number;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  valor: number;

  @Column({ name: 'vigente_desde', type: 'datetime' })
  vigenteDesde: Date;
}

/** Valores ya reemplazados de un artículo en una lista. */
@Entity('precios_articulo_historial')
export class PrecioArticuloHistorial extends EntidadBase {
  @Column({ name: 'lista_precio_id' })
  listaPrecioId: number;

  @Column({ name: 'articulo_id' })
  articuloId: number;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  valor: number;

  @Column({ name: 'vigente_desde', type: 'datetime' })
  vigenteDesde: Date;

  @Column({ name: 'vigente_hasta', type: 'datetime' })
  vigenteHasta: Date;
}
