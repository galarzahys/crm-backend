import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntidadBase } from '../../../common/entities/entidad-base.entity';
import { Moneda } from '../../listas-precio/entities/lista-precio.entity';

export type TipoServicio = 'venta_contenedores' | 'alquiler_contenedores' | 'modificacion' | 'accesorios';

/**
 * Costo (no precio de venta) por unidad, discriminado por **origen**
 * (`material` o `mano_obra` — estructural, viene de qué tabla lo generó,
 * no de un campo que cargue el usuario) y moneda. Misma forma que
 * devuelve `GET /articulos/:id/costo-detallado`.
 */
export interface CostoDetalladoItem {
  origen: 'material' | 'mano_obra';
  moneda: Moneda;
  total: number;
}

@Entity('presupuestos')
export class Presupuesto extends EntidadBase {
  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'vendedor_id' })
  vendedorId: number;

  @Column({ type: 'varchar' })
  servicio: TipoServicio;

  @Column({ name: 'plazo_validez_dias' })
  plazoValidezDias: number;

  @Column({ name: 'fecha_emision', type: 'datetime' })
  fechaEmision: Date;

  @Column({ name: 'lista_precio_id' })
  listaPrecioId: number;

  @Column({ name: 'descuento_general_porcentaje', type: 'decimal', precision: 7, scale: 4, default: 0 })
  descuentoGeneralPorcentaje: number;

  @Column({ name: 'descuento_general_valor', type: 'decimal', precision: 14, scale: 2, default: 0 })
  descuentoGeneralValor: number;

  /**
   * Cotización del dólar (1 USD = X ARS) del día del presupuesto. Se usa
   * para convertir a pesos el costo de los artículos costeados en dólares,
   * y así poder calcular el desglose de costos (materiales ARS/USD, mano
   * de obra) con porcentajes correctos sobre un total único en pesos.
   */
  @Column({ name: 'cotizacion_dolar', type: 'decimal', precision: 12, scale: 4, nullable: true })
  cotizacionDolar: number | null;

  @OneToMany(() => PresupuestoItem, (item) => item.presupuesto, { cascade: true })
  items: PresupuestoItem[];
}

/**
 * Línea de artículo dentro de un presupuesto. El precio, la moneda, la
 * lista usada, el descuento **y el costo** (`costoDetallado`) quedan
 * congelados acá al momento de crear/editar el presupuesto (no se
 * recalculan solos si después cambia el precio de lista o el costo de
 * algún material) — así un presupuesto viejo siempre muestra el margen
 * real que tenía en su momento, no uno recalculado con datos de hoy.
 */
@Entity('presupuesto_items')
export class PresupuestoItem extends EntidadBase {
  @Column({ name: 'presupuesto_id' })
  presupuestoId: number;

  @ManyToOne(() => Presupuesto, (presupuesto) => presupuesto.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'presupuesto_id' })
  presupuesto: Presupuesto;

  @Column({ name: 'articulo_id' })
  articuloId: number;

  @Column({ name: 'lista_precio_id' })
  listaPrecioId: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 14, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'varchar' })
  moneda: Moneda;

  @Column()
  cantidad: number;

  @Column({ name: 'descuento_porcentaje', type: 'decimal', precision: 7, scale: 4, default: 0 })
  descuentoPorcentaje: number;

  @Column({ name: 'descuento_valor', type: 'decimal', precision: 14, scale: 2, default: 0 })
  descuentoValor: number;

  /**
   * Costo (de producción, no de venta) **por unidad** de este artículo,
   * discriminado por origen y moneda, congelado al momento de agregarlo
   * al presupuesto. El total de esa línea sale de multiplicar cada
   * entrada por `cantidad` (ambos ya congelados).
   */
  @Column({ name: 'costo_detallado', type: 'simple-json', nullable: true })
  costoDetallado: CostoDetalladoItem[] | null;
}
