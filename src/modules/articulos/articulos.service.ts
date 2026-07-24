import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { ResultadoPaginado } from '../../common/interfaces/resultado-paginado.interface';
import { GuardarArticuloDto, ListarArticulosQueryDto } from './articulo.dto';
import { Articulo, ArticuloAtributo, ArticuloComponente } from './entities/articulo.entity';

const CAMPOS_BUSQUEDA = ['nombre', 'descripcionComprador'];

@Injectable()
export class ArticulosService extends CrudService<Articulo> {
  constructor(
    @InjectRepository(Articulo) repositorio: Repository<Articulo>,
    @InjectRepository(ArticuloAtributo) private readonly repositorioAtributos: Repository<ArticuloAtributo>,
    @InjectRepository(ArticuloComponente) private readonly repositorioComponentes: Repository<ArticuloComponente>,
  ) {
    super(repositorio, 'articulo');
  }

  /** Igual que `listar()`, pero agrega el filtro por categoría (mismo criterio que en el frontend). */
  async listarFiltrado(query: ListarArticulosQueryDto): Promise<ResultadoPaginado<Articulo>> {
    const pagina = query.pagina ?? 0;
    const tamanio = query.tamanio ?? 12;

    const qb = this.repositorio
      .createQueryBuilder('articulo')
      .leftJoinAndSelect('articulo.atributos', 'atributoAsignado', 'atributoAsignado.activo = :activo', { activo: true })
      .leftJoinAndSelect('articulo.componentes', 'componente', 'componente.activo = :activo', { activo: true })
      .where('articulo.activo = :activo', { activo: true });

    if (query.categoriaId) {
      qb.andWhere('articulo.categoriaId = :categoriaId', { categoriaId: query.categoriaId });
    }

    if (query.busqueda) {
      qb.andWhere('(articulo.nombre LIKE :busqueda OR articulo.descripcionComprador LIKE :busqueda)', {
        busqueda: `%${query.busqueda}%`,
      });
    }

    qb.orderBy(`articulo.${query.ordenarPor ?? 'nombre'}`, query.direccion === 'desc' ? 'DESC' : 'ASC');
    qb.skip(pagina * tamanio).take(tamanio);

    const [datos, total] = await qb.getManyAndCount();
    return { datos, total, pagina, tamanio };
  }

  async crearConAtributos(dto: GuardarArticuloDto): Promise<Articulo> {
    const articulo = await this.crear({
      nombre: dto.nombre,
      descripcionInterna: dto.descripcionInterna ?? null,
      descripcionComprador: dto.descripcionComprador ?? null,
      categoriaId: dto.categoriaId,
      imagenKey: dto.imagenKey ?? null,
      imagenUrlVisualizacion: dto.imagenUrlVisualizacion ?? null,
    });
    if (dto.atributos !== undefined) {
      await this.reemplazarAtributos(articulo.id, dto.atributos);
    }
    if (dto.componentes !== undefined) {
      await this.reemplazarComponentes(articulo.id, dto.componentes);
    }
    return this.obtenerPorId(articulo.id);
  }

  async actualizarConAtributos(id: number, dto: GuardarArticuloDto): Promise<Articulo> {
    await this.actualizar(id, {
      nombre: dto.nombre,
      descripcionInterna: dto.descripcionInterna ?? null,
      descripcionComprador: dto.descripcionComprador ?? null,
      categoriaId: dto.categoriaId,
      imagenKey: dto.imagenKey ?? null,
      imagenUrlVisualizacion: dto.imagenUrlVisualizacion ?? null,
    });
    // Importante: `atributos`/`componentes` solo se reemplazan si vienen en el
    // pedido. El formulario básico del artículo administra `atributos` pero no
    // `componentes` (que ahora vive en su propia pantalla) — si tratáramos
    // "no vino" igual que "vino vacío", cada edición básica del artículo
    // borraría la composición de costos sin que el usuario lo pidiera.
    if (dto.atributos !== undefined) {
      await this.reemplazarAtributos(id, dto.atributos);
    }
    if (dto.componentes !== undefined) {
      await this.reemplazarComponentes(id, dto.componentes);
    }
    return this.obtenerPorId(id);
  }

  override async obtenerPorId(id: number): Promise<Articulo> {
    const articulo = await this.repositorio.findOne({
      where: { id, activo: true } as any,
      relations: { atributos: true, componentes: true },
    });
    if (!articulo) {
      throw new Error(`No se encontró el artículo con id ${id}.`);
    }
    return articulo;
  }

  private async reemplazarAtributos(articuloId: number, atributos: GuardarArticuloDto['atributos']): Promise<void> {
    const actuales = await this.repositorioAtributos.find({ where: { articuloId, activo: true } as any });
    for (const asignacion of actuales) {
      await this.repositorioAtributos.delete(asignacion.id);
    }

    for (const asignado of atributos ?? []) {
      const nueva = this.repositorioAtributos.create({
        articuloId,
        atributoId: asignado.atributoId,
        valorLibre: asignado.valorLibre ?? null,
        opcionId: asignado.opcionId ?? null,
      });
      await this.repositorioAtributos.save(nueva);
    }
  }

  private async reemplazarComponentes(articuloId: number, componentes: GuardarArticuloDto['componentes']): Promise<void> {
    const actuales = await this.repositorioComponentes.find({ where: { articuloId, activo: true } as any });
    for (const componente of actuales) {
      await this.repositorioComponentes.delete(componente.id);
    }

    for (const asignado of componentes ?? []) {
      const nuevo = this.repositorioComponentes.create({
        articuloId,
        materialId: asignado.materialId,
        cantidad: asignado.cantidad,
      });
      await this.repositorioComponentes.save(nuevo);
    }
  }
}
