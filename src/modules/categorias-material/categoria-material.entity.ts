import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';

/**
 * Categoría de material, definida libremente por el usuario (reemplaza al
 * antiguo `tipo` fijo de `Material`). Admite anidamiento arbitrario vía
 * `padreId` (auto-referencia) — así se pueden armar subcategorías, y el
 * ajuste masivo de costo por categoría puede afectar a una categoría y a
 * todas sus descendientes de una sola vez. Tabla `categorias_material`.
 */
@Entity('categorias_material')
export class CategoriaMaterial extends EntidadBase {
  @Column()
  nombre: string;

  @Column({ name: 'padre_id', type: 'int', nullable: true })
  padreId: number | null;

  @ManyToOne(() => CategoriaMaterial, { nullable: true })
  @JoinColumn({ name: 'padre_id' })
  padre: CategoriaMaterial | null;
}
