import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { ResultadoPaginado } from '../../common/interfaces/resultado-paginado.interface';
import { Moneda } from '../listas-precio/entities/lista-precio.entity';
import { TipoMaterial } from '../materiales/material.entity';
import { MaterialesService } from '../materiales/materiales.service';
import { GuardarArticuloDto, ListarArticulosQueryDto } from './articulo.dto';
import { Articulo, ArticuloAtributo, ArticuloComponente, ArticuloSubarticulo } from './entities/articulo.entity';

const CAMPOS_BUSQUEDA = ['nombre', 'descripcionComprador'];

/** Total de costo agrupado por moneda, resultado de `calcularCostoTotal`. */
export interface TotalCostoPorMoneda {
  moneda: Moneda;
  total: number;
}

/** Total de costo agrupado por tipo de componente (material/mano de obra/accesorio) y moneda, resultado de `calcularCostoDetallado`. */
export interface TotalCostoDetallado {
  tipo: TipoMaterial;
  moneda: Moneda;
  total: number;
}

@Injectable()
export class ArticulosService extends CrudService<Articulo> {
  constructor(
    @InjectRepository(Articulo) repositorio: Repository<Articulo>,
    @InjectRepository(ArticuloAtributo) private readonly repositorioAtributos: Repository<ArticuloAtributo>,
    @InjectRepository(ArticuloComponente) private readonly repositorioComponentes: Repository<ArticuloComponente>,
    @InjectRepository(ArticuloSubarticulo) private readonly repositorioSubarticulos: Repository<ArticuloSubarticulo>,
    private readonly materialesService: MaterialesService,
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
      .leftJoinAndSelect('articulo.subarticulos', 'subarticulo', 'subarticulo.activo = :activo', { activo: true })
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
    if (dto.subarticulos !== undefined) {
      // Un artículo recién creado no puede formar parte de ningún ciclo
      // todavía (nada puede referenciarlo de antes), así que acá no hace
      // falta validar — sí hace falta al editar (ver más abajo).
      await this.reemplazarSubarticulos(articulo.id, dto.subarticulos);
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
    // Importante: `atributos`/`componentes`/`subarticulos` solo se
    // reemplazan si vienen en el pedido (ver nota de más abajo, ya la
    // habíamos agregado para no perder la composición al editar solo los
    // datos básicos del artículo desde el formulario principal).
    if (dto.atributos !== undefined) {
      await this.reemplazarAtributos(id, dto.atributos);
    }
    if (dto.componentes !== undefined) {
      await this.reemplazarComponentes(id, dto.componentes);
    }
    if (dto.subarticulos !== undefined) {
      await this.validarSinCiclos(id, dto.subarticulos);
      await this.reemplazarSubarticulos(id, dto.subarticulos);
    }
    return this.obtenerPorId(id);
  }

  override async obtenerPorId(id: number): Promise<Articulo> {
    const articulo = await this.repositorio.findOne({
      where: { id, activo: true } as any,
      relations: { atributos: true, componentes: true, subarticulos: true },
    });
    if (!articulo) {
      throw new Error(`No se encontró el artículo con id ${id}.`);
    }
    return articulo;
  }

  /**
   * Costo total del artículo, recursivo: suma de sus materiales directos
   * más, para cada subartículo, `cantidad × costo total de ese
   * subartículo` (que a su vez puede tener sus propios materiales y
   * subartículos). Agrupado por moneda, porque distintos materiales o
   * subartículos pueden estar costeados en ARS y en USD a la vez.
   *
   * `visitados` es un corte de seguridad ante datos inconsistentes (no
   * debería hacer falta en el uso normal, porque `validarSinCiclos` ya
   * impide guardar una composición circular) — evita un loop infinito si
   * de todas formas apareciera un ciclo.
   */
  async calcularCostoTotal(articuloId: number, visitados: Set<number> = new Set()): Promise<TotalCostoPorMoneda[]> {
    if (visitados.has(articuloId)) {
      return [];
    }
    visitados.add(articuloId);

    const articulo = await this.repositorio.findOne({
      where: { id: articuloId, activo: true } as any,
      relations: { componentes: true, subarticulos: true },
    });
    if (!articulo) {
      return [];
    }

    const totales = new Map<Moneda, number>();

    for (const componente of articulo.componentes ?? []) {
      const costo = await this.materialesService.obtenerCosto(componente.materialId);
      if (!costo) {
        continue;
      }
      totales.set(costo.moneda, (totales.get(costo.moneda) ?? 0) + componente.cantidad * costo.valor);
    }

    for (const subarticulo of articulo.subarticulos ?? []) {
      const costosSub = await this.calcularCostoTotal(subarticulo.subarticuloId, visitados);
      for (const { moneda, total } of costosSub) {
        totales.set(moneda, (totales.get(moneda) ?? 0) + total * subarticulo.cantidad);
      }
    }

    return Array.from(totales.entries()).map(([moneda, total]) => ({
      moneda,
      total: Math.round((total + Number.EPSILON) * 100) / 100,
    }));
  }

  /**
   * Igual que `calcularCostoTotal`, pero además discrimina por tipo de
   * componente (material / mano de obra / accesorio) — se usa para el
   * desglose de costos del presupuesto. Recursivo: el desglose de un
   * subartículo se preserva por tipo al burbujear hacia el padre (un
   * material dentro de un subartículo sigue contando como "material"
   * arriba, no se mezcla con la mano de obra del padre).
   */
  async calcularCostoDetallado(articuloId: number, visitados: Set<number> = new Set()): Promise<TotalCostoDetallado[]> {
    if (visitados.has(articuloId)) {
      return [];
    }
    visitados.add(articuloId);

    const articulo = await this.repositorio.findOne({
      where: { id: articuloId, activo: true } as any,
      relations: { componentes: true, subarticulos: true },
    });
    if (!articulo) {
      return [];
    }

    const totales = new Map<string, TotalCostoDetallado>();
    const acumular = (tipo: TipoMaterial, moneda: Moneda, monto: number) => {
      const clave = `${tipo}|${moneda}`;
      const actual = totales.get(clave);
      if (actual) {
        actual.total += monto;
      } else {
        totales.set(clave, { tipo, moneda, total: monto });
      }
    };

    for (const componente of articulo.componentes ?? []) {
      const costo = await this.materialesService.obtenerCosto(componente.materialId);
      if (!costo) {
        continue;
      }
      let tipo: TipoMaterial = 'material';
      try {
        const material = await this.materialesService.obtenerPorId(componente.materialId);
        tipo = material.tipo;
      } catch {
        // Material dado de baja o inexistente: lo contamos igual como "material" genérico.
      }
      acumular(tipo, costo.moneda, componente.cantidad * costo.valor);
    }

    for (const subarticulo of articulo.subarticulos ?? []) {
      const detalleSub = await this.calcularCostoDetallado(subarticulo.subarticuloId, visitados);
      for (const { tipo, moneda, total } of detalleSub) {
        acumular(tipo, moneda, total * subarticulo.cantidad);
      }
    }

    return Array.from(totales.values()).map(({ tipo, moneda, total }) => ({
      tipo,
      moneda,
      total: Math.round((total + Number.EPSILON) * 100) / 100,
    }));
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

  private async reemplazarSubarticulos(articuloId: number, subarticulos: GuardarArticuloDto['subarticulos']): Promise<void> {
    const actuales = await this.repositorioSubarticulos.find({ where: { articuloId, activo: true } as any });
    for (const subarticulo of actuales) {
      await this.repositorioSubarticulos.delete(subarticulo.id);
    }

    for (const asignado of subarticulos ?? []) {
      const nuevo = this.repositorioSubarticulos.create({
        articuloId,
        subarticuloId: asignado.subarticuloId,
        cantidad: asignado.cantidad,
      });
      await this.repositorioSubarticulos.save(nuevo);
    }
  }

  /**
   * Antes de guardar la lista de subartículos de `articuloId`, verifica
   * que ninguno genere una composición circular: ni que se agregue a sí
   * mismo, ni que alguno de los subartículos elegidos ya contenga (directa
   * o indirectamente) a `articuloId` entre los suyos.
   */
  private async validarSinCiclos(articuloId: number, propuestos: GuardarArticuloDto['subarticulos']): Promise<void> {
    for (const propuesto of propuestos ?? []) {
      if (propuesto.subarticuloId === articuloId) {
        throw new BadRequestException('Un artículo no puede ser subartículo de sí mismo.');
      }
      const generariaCiclo = await this.contieneTransitivamente(propuesto.subarticuloId, articuloId);
      if (generariaCiclo) {
        throw new BadRequestException(
          `No se puede agregar ese artículo como subartículo: generaría una composición circular (ya contiene, directa o indirectamente, a este artículo).`,
        );
      }
    }
  }

  /** ¿`raizId` contiene a `buscadoId` entre sus subartículos, en cualquier nivel de profundidad? */
  private async contieneTransitivamente(raizId: number, buscadoId: number, visitados: Set<number> = new Set()): Promise<boolean> {
    if (raizId === buscadoId) {
      return true;
    }
    if (visitados.has(raizId)) {
      return false;
    }
    visitados.add(raizId);

    const hijos = await this.repositorioSubarticulos.find({ where: { articuloId: raizId, activo: true } as any });
    for (const hijo of hijos) {
      if (await this.contieneTransitivamente(hijo.subarticuloId, buscadoId, visitados)) {
        return true;
      }
    }
    return false;
  }
}
