import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { CrearPresupuestoDto } from './presupuesto.dto';
import { Presupuesto, PresupuestoItem } from './entities/presupuesto.entity';

@Injectable()
export class PresupuestosService extends CrudService<Presupuesto> {
  constructor(
    @InjectRepository(Presupuesto) repositorio: Repository<Presupuesto>,
    @InjectRepository(PresupuestoItem) private readonly repositorioItems: Repository<PresupuestoItem>,
  ) {
    super(repositorio, 'presupuesto');
  }

  override async listarTodas(): Promise<Presupuesto[]> {
    return this.repositorio.find({ where: { activo: true } as any, relations: { items: true }, order: { id: 'DESC' } as any });
  }

  override async obtenerPorId(id: number): Promise<Presupuesto> {
    const presupuesto = await this.repositorio.findOne({ where: { id, activo: true } as any, relations: { items: true } });
    if (!presupuesto) {
      throw new Error(`No se encontró el presupuesto con id ${id}.`);
    }
    return presupuesto;
  }

  async crearConItems(dto: CrearPresupuestoDto): Promise<Presupuesto> {
    const presupuesto = await this.crear({
      clienteId: dto.clienteId,
      vendedorId: dto.vendedorId,
      servicio: dto.servicio,
      plazoValidezDias: dto.plazoValidezDias,
      fechaEmision: new Date(),
      listaPrecioId: dto.listaPrecioId,
      descuentoGeneralPorcentaje: dto.descuentoGeneralPorcentaje,
      descuentoGeneralValor: dto.descuentoGeneralValor,
    });

    for (const item of dto.items) {
      const nuevo = this.repositorioItems.create({ presupuestoId: presupuesto.id, ...item });
      await this.repositorioItems.save(nuevo);
    }

    return this.obtenerPorId(presupuesto.id);
  }
}
