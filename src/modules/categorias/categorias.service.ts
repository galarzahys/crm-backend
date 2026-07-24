import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { Categoria } from './categoria.entity';

const CATEGORIAS_INICIALES = ['Contenedores', 'Módulos', 'Accesorios'];

@Injectable()
export class CategoriasService extends CrudService<Categoria> implements OnModuleInit {
  private readonly logger = new Logger(CategoriasService.name);

  constructor(@InjectRepository(Categoria) repositorio: Repository<Categoria>) {
    super(repositorio, 'categoria');
  }

  /** Siembra las categorías iniciales del negocio la primera vez que arranca el backend. */
  async onModuleInit(): Promise<void> {
    const existentes = await this.listarTodas();
    if (existentes.length > 0) {
      return;
    }
    for (const nombre of CATEGORIAS_INICIALES) {
      await this.crear({ nombre } as Partial<Categoria>);
    }
    this.logger.log(`Categorías iniciales creadas: ${CATEGORIAS_INICIALES.join(', ')}`);
  }
}
