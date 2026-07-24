import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';

@Entity('vendedores')
export class Vendedor extends EntidadBase {
  @Column()
  nombre: string;
}
