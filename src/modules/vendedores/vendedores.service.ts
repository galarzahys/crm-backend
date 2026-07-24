import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { Vendedor } from './vendedor.entity';

const VENDEDORES_INICIALES = ['Lucas Martínez', 'Ayelén Sosa', 'Federico Gómez', 'Carla Nuñez'];

@Injectable()
export class VendedoresService extends CrudService<Vendedor> implements OnModuleInit {
  private readonly logger = new Logger(VendedoresService.name);

  constructor(@InjectRepository(Vendedor) repositorio: Repository<Vendedor>) {
    super(repositorio, 'vendedor');
  }

  async onModuleInit(): Promise<void> {
    const existentes = await this.listarTodas();
    if (existentes.length > 0) {
      return;
    }
    for (const nombre of VENDEDORES_INICIALES) {
      await this.crear({ nombre } as Partial<Vendedor>);
    }
    this.logger.log(`Vendedores de ejemplo creados: ${VENDEDORES_INICIALES.join(', ')}`);
  }
}
