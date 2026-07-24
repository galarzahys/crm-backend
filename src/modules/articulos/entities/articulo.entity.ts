import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntidadBase } from '../../../common/entities/entidad-base.entity';
import { Categoria } from '../../categorias/categoria.entity';

@Entity('articulos')
export class Articulo extends EntidadBase {
  @Column()
  nombre: string;

  @Column({ name: 'descripcion_interna', type: 'text', nullable: true })
  descripcionInterna: string | null;

  @Column({ name: 'descripcion_comprador', type: 'text', nullable: true })
  descripcionComprador: string | null;

  @Column({ name: 'categoria_id' })
  categoriaId: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  /**
   * Clave del objeto en el bucket de S3. Por ahora solo se persiste el
   * dato; la generación de URLs prefirmadas de subida/lectura queda para
   * cuando conectemos el módulo de almacenamiento (ver README).
   */
  @Column({ name: 'imagen_key', type: 'varchar', nullable: true })
  imagenKey: string | null;

  @Column({ name: 'imagen_url_visualizacion', type: 'varchar', length: 1000, nullable: true })
  imagenUrlVisualizacion: string | null;

  @OneToMany(() => ArticuloAtributo, (asignacion) => asignacion.articulo, { cascade: true })
  atributos: ArticuloAtributo[];

  @OneToMany(() => ArticuloComponente, (componente) => componente.articulo, { cascade: true })
  componentes: ArticuloComponente[];
}

/**
 * Tabla de relación artículo↔atributo, con el valor concreto asignado
 * (texto libre u opción elegida). Igual criterio que `AtributoAsignado`
 * en el frontend, pero acá sí es una tabla propia (no embebida).
 */
@Entity('articulo_atributos')
export class ArticuloAtributo extends EntidadBase {
  @Column({ name: 'articulo_id' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.atributos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ name: 'atributo_id' })
  atributoId: number;

  @Column({ name: 'valor_libre', type: 'varchar', nullable: true })
  valorLibre: string | null;

  @Column({ name: 'opcion_id', type: 'int', nullable: true })
  opcionId: number | null;
}

/**
 * Composición de costos de un artículo: qué materiales/mano de obra
 * entran, y en qué cantidad (en la unidad de medida propia del material).
 * Tabla de relación `articulo_componentes`, con clave foránea
 * `articulo_id`. `material_id` se guarda como columna simple (sin
 * relación de TypeORM cargada) para no acoplar el módulo de artículos al
 * de materiales — el frontend ya tiene la lista de materiales (con su
 * costo) cargada y resuelve el detalle de costo ahí.
 */
@Entity('articulo_componentes')
export class ArticuloComponente extends EntidadBase {
  @Column({ name: 'articulo_id' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.componentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  cantidad: number;
}
