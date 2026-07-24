import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { ListaPrecio } from './entities/lista-precio.entity';

@Injectable()
export class ListasPrecioService extends CrudService<ListaPrecio> {
  constructor(@InjectRepository(ListaPrecio) repositorio: Repository<ListaPrecio>) {
    super(repositorio, 'lista');
  }
}
