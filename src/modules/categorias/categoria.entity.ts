import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';

@Entity('categorias')
export class Categoria extends EntidadBase {
  @Column()
  nombre: string;
}
