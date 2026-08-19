import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';

/**
 * Tipo de mano de obra (ej: "Mano de obra metalúrgica", "Mano de obra
 * pintura"), que se puede usar como componente de costo de un artículo.
 * Tabla `mano_de_obra`. El costo vigente y su historial viven en el
 * módulo compartido `costos-recursos`, con `tipoRecurso = 'mano_obra'`.
 */
@Entity('mano_de_obra')
export class ManoDeObra extends EntidadBase {
  @Column()
  nombre: string;

  /** Ej: "hora", "m2", "unidad". Texto libre. */
  @Column({ name: 'unidad_medida' })
  unidadMedida: string;
}
