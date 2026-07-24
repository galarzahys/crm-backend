import { NotFoundException } from '@nestjs/common';
import { Brackets, DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { PaginacionQueryDto } from './dto/paginacion-query.dto';
import { EntidadBase } from './entities/entidad-base.entity';
import { ResultadoPaginado } from './interfaces/resultado-paginado.interface';

/**
 * Servicio CRUD genérico sobre una entidad con baja lógica.
 *
 * Es el equivalente, del lado del backend, de `CacheRepository<T>` en el
 * frontend: ahí resolvía todo en memoria: acá lo mismo, pero contra la
 * base de datos real vía TypeORM. Cada servicio de entidad extiende esta
 * clase y solo agrega la lógica de negocio propia (si la tiene).
 */
export abstract class CrudService<T extends EntidadBase> {
  protected constructor(
    protected readonly repositorio: Repository<T>,
    /** Alias usado en el query builder (por defecto, "entidad"). */
    protected readonly alias: string = 'entidad',
  ) {}

  async listar(query: PaginacionQueryDto, camposBusqueda: string[] = []): Promise<ResultadoPaginado<T>> {
    const pagina = query.pagina ?? 0;
    const tamanio = query.tamanio ?? 10;

    const qb = this.repositorio
      .createQueryBuilder(this.alias)
      .where(`${this.alias}.activo = :activo`, { activo: true });

    if (query.busqueda && camposBusqueda.length > 0) {
      qb.andWhere(
        new Brackets((sub) => {
          camposBusqueda.forEach((campo, indice) => {
            const condicion = `${this.alias}.${campo} LIKE :busqueda`;
            const parametros = { busqueda: `%${query.busqueda}%` };
            if (indice === 0) {
              sub.where(condicion, parametros);
            } else {
              sub.orWhere(condicion, parametros);
            }
          });
        }),
      );
    }

    if (query.ordenarPor) {
      qb.orderBy(`${this.alias}.${query.ordenarPor}`, query.direccion === 'desc' ? 'DESC' : 'ASC');
    }

    qb.skip(pagina * tamanio).take(tamanio);

    const [datos, total] = await qb.getManyAndCount();
    return { datos, total, pagina, tamanio };
  }

  async listarTodas(): Promise<T[]> {
    return this.repositorio.find({ where: { activo: true } as FindOptionsWhere<T>, order: { id: 'ASC' } as any });
  }

  async obtenerPorId(id: number): Promise<T> {
    const entidad = await this.repositorio.findOne({ where: { id, activo: true } as FindOptionsWhere<T> });
    if (!entidad) {
      throw new NotFoundException(`No se encontró el registro con id ${id}.`);
    }
    return entidad;
  }

  async crear(datos: DeepPartial<T>): Promise<T> {
    const entidad = this.repositorio.create({ ...datos, activo: true } as DeepPartial<T>);
    return this.repositorio.save(entidad);
  }

  async actualizar(id: number, cambios: DeepPartial<T>): Promise<T> {
    await this.obtenerPorId(id);
    await this.repositorio.update(id, cambios as any);
    return this.obtenerPorId(id);
  }

  /** Baja lógica: no elimina el registro, lo marca como inactivo (igual que en el frontend). */
  async eliminar(id: number): Promise<void> {
    await this.obtenerPorId(id);
    await this.repositorio.update(id, { activo: false } as any);
  }
}
