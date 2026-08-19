import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';
import { CategoriaMaterial } from '../categorias-material/categoria-material.entity';

/**
 * Material que se puede usar como componente de costo de un artículo.
 * Tabla `materiales`. `categoriaId` reemplaza al antiguo `tipo` fijo: la
 * categoría ahora la define el usuario (ver módulo `categorias-material`).
 * El costo vigente y su historial viven en el módulo compartido
 * `costos-recursos` (`RecursoCosto`/`RecursoCostoHistorial`, con
 * `tipoRecurso = 'material'`), no acá.
 */
@Entity('materiales')
export class Material extends EntidadBase {
  @Column()
  nombre: string;

  @Column({ name: 'categoria_id' })
  categoriaId: number;

  @ManyToOne(() => CategoriaMaterial)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaMaterial;

  /** Ej: "kg", "m2", "hora", "unidad". Texto libre. */
  @Column({ name: 'unidad_medida' })
  unidadMedida: string;
}
