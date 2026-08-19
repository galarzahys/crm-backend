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

  @Column({ name: 'imagen_key', type: 'varchar', nullable: true })
  imagenKey: string | null;

  @Column({ name: 'imagen_url_visualizacion', type: 'varchar', length: 1000, nullable: true })
  imagenUrlVisualizacion: string | null;

  @OneToMany(() => ArticuloAtributo, (asignacion) => asignacion.articulo, { cascade: true })
  atributos: ArticuloAtributo[];

  @OneToMany(() => ArticuloComponente, (componente) => componente.articulo, { cascade: true })
  componentes: ArticuloComponente[];

  @OneToMany(() => ArticuloManoDeObra, (manoDeObra) => manoDeObra.articulo, { cascade: true })
  manoDeObra: ArticuloManoDeObra[];

  @OneToMany(() => ArticuloSubarticulo, (subarticulo) => subarticulo.articulo, { cascade: true })
  subarticulos: ArticuloSubarticulo[];
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
 * Composición de costos de un artículo: qué materiales entran, y en qué
 * cantidad (en la unidad de medida propia del material). Tabla de
 * relación `articulo_componentes`. `material_id` se guarda como columna
 * simple (sin relación de TypeORM cargada) para no acoplar el módulo de
 * artículos al de materiales — el frontend ya tiene la lista de
 * materiales (con su costo) cargada y resuelve el detalle ahí.
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

/**
 * Composición de costos de un artículo a partir de mano de obra (tabla
 * hermana de `ArticuloComponente`, para el recurso "mano de obra" en vez
 * de "material" — separación estructural, no por un campo de tipo).
 */
@Entity('articulo_mano_obra')
export class ArticuloManoDeObra extends EntidadBase {
  @Column({ name: 'articulo_id' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.manoDeObra, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ name: 'mano_de_obra_id' })
  manoDeObraId: number;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  cantidad: number;
}

/**
 * Composición de costos de un artículo a partir de **otro artículo**
 * (subartículo). El costo del subartículo (recursivo: puede tener sus
 * propios materiales, mano de obra y subartículos) pasa a formar parte
 * del costo del artículo padre, multiplicado por `cantidad`.
 */
@Entity('articulo_subarticulos')
export class ArticuloSubarticulo extends EntidadBase {
  @Column({ name: 'articulo_id' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.subarticulos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ name: 'subarticulo_id' })
  subarticuloId: number;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  cantidad: number;
}
