import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntidadBase } from '../../../common/entities/entidad-base.entity';

export type TipoAtributo = 'libre' | 'opciones';

@Entity('atributos')
export class Atributo extends EntidadBase {
  @Column()
  nombre: string;

  @Column({ name: 'unidad_medida', type: 'varchar', nullable: true })
  unidadMedida: string | null;

  /**
   * `varchar` en vez de un enum nativo de columna: los enums de MySQL y
   * SQLite se comportan distinto en TypeORM, y como el backend tiene que
   * poder correr contra los dos motores (ver `config/database.config.ts`),
   * usamos `varchar` + validación a nivel aplicación (`class-validator`,
   * ver `atributo.dto.ts`). El tipo de TypeScript (`TipoAtributo`) sigue
   * dando seguridad de tipos en el código.
   */
  @Column({ type: 'varchar' })
  tipo: TipoAtributo;

  @OneToMany(() => AtributoOpcion, (opcion) => opcion.atributo)
  opciones: AtributoOpcion[];
}

@Entity('atributo_opciones')
export class AtributoOpcion extends EntidadBase {
  @Column({ name: 'atributo_id' })
  atributoId: number;

  @ManyToOne(() => Atributo, (atributo) => atributo.opciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atributo_id' })
  atributo: Atributo;

  @Column()
  valor: string;
}
