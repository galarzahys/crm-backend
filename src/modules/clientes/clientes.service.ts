import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginacionQueryDto } from '../../common/dto/paginacion-query.dto';
import { ResultadoPaginado } from '../../common/interfaces/resultado-paginado.interface';
import { CamposFichaClienteService } from '../campos-ficha-cliente/campos-ficha-cliente.service';
import { CampoFichaCliente } from '../campos-ficha-cliente/campo-ficha-cliente.entity';
import { GuardarClienteDto } from './cliente.dto';
import { Cliente, ClienteValorCampo } from './cliente.entity';

/** Forma en la que se devuelve un cliente hacia afuera: valores + una etiqueta legible para mostrarlo en listas/autocomplete. */
export interface ClienteConValores {
  id: number;
  creadoEn: Date;
  actualizadoEn: Date;
  activo: boolean;
  valores: { campoId: number; valor: string }[];
  etiqueta: string;
}

const CLIENTES_DEMO = [
  ['Constructora Del Sur S.A.', '30-71234567-8'],
  ['María Eugenia Ferreyra', '27-32456789-1'],
  ['Logística Patagónica SRL', '30-70987654-2'],
  ['Juan Carlos Domínguez', '20-25678912-3'],
];

@Injectable()
export class ClientesService implements OnModuleInit {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    @InjectRepository(Cliente) private readonly repositorio: Repository<Cliente>,
    @InjectRepository(ClienteValorCampo) private readonly repositorioValores: Repository<ClienteValorCampo>,
    private readonly camposFichaClienteService: CamposFichaClienteService,
  ) {}

  /**
   * Al arrancar por primera vez (sin ningún campo de ficha definido
   * todavía), crea un par de campos básicos para que el sistema no
   * arranque completamente vacío, y siembra un par de clientes de
   * ejemplo con esos valores. Si el usuario ya definió su propia ficha,
   * no toca nada.
   */
  async onModuleInit(): Promise<void> {
    const camposExistentes = await this.camposFichaClienteService.listarTodas();
    let campoNombre: CampoFichaCliente;
    let campoDocumento: CampoFichaCliente;

    if (camposExistentes.length === 0) {
      campoNombre = await this.camposFichaClienteService.crearCampo({
        nombre: 'Nombre completo',
        tipo: 'texto',
        obligatorio: true,
        esBuscador: true,
      });
      campoDocumento = await this.camposFichaClienteService.crearCampo({
        nombre: 'Documento',
        tipo: 'texto',
        obligatorio: true,
        esBuscador: true,
      });
      this.logger.log('Ficha de cliente inicial creada: Nombre completo, Documento.');
    } else {
      return; // el usuario ya tiene su propia ficha armada; no sembramos clientes de ejemplo.
    }

    const existentes = await this.repositorio.count();
    if (existentes > 0) {
      return;
    }

    for (const [nombre, documento] of CLIENTES_DEMO) {
      await this.crear({
        valores: [
          { campoId: campoNombre.id, valor: nombre },
          { campoId: campoDocumento.id, valor: documento },
        ],
      });
    }
    this.logger.log(`Clientes de ejemplo creados: ${CLIENTES_DEMO.length}`);
  }

  async listar(query: PaginacionQueryDto): Promise<ResultadoPaginado<ClienteConValores>> {
    const pagina = query.pagina ?? 0;
    const tamanio = query.tamanio ?? 10;

    let idsCandidatos: number[] | null = null;
    if (query.busqueda) {
      idsCandidatos = await this.buscarIdsPorTexto(query.busqueda);
      if (idsCandidatos !== null && idsCandidatos.length === 0) {
        return { datos: [], total: 0, pagina, tamanio };
      }
    }

    const qb = this.repositorio.createQueryBuilder('cliente').where('cliente.activo = :activo', { activo: true });
    if (idsCandidatos) {
      qb.andWhere('cliente.id IN (:...ids)', { ids: idsCandidatos });
    }
    qb.orderBy('cliente.id', 'DESC').skip(pagina * tamanio).take(tamanio);

    const [clientes, total] = await qb.getManyAndCount();
    const datos = await this.cargarConValores(clientes.map((c) => c.id));

    return { datos, total, pagina, tamanio };
  }

  async obtenerPorId(id: number): Promise<ClienteConValores> {
    const [cliente] = await this.cargarConValores([id]);
    if (!cliente) {
      throw new NotFoundException(`No se encontró el cliente con id ${id}.`);
    }
    return cliente;
  }

  async crear(dto: GuardarClienteDto): Promise<ClienteConValores> {
    await this.validarObligatorios(dto);

    const cliente = this.repositorio.create({ activo: true });
    await this.repositorio.save(cliente);

    await this.guardarValores(cliente.id, dto.valores);
    return this.obtenerPorId(cliente.id);
  }

  async actualizar(id: number, dto: GuardarClienteDto): Promise<ClienteConValores> {
    await this.validarObligatorios(dto);

    const cliente = await this.repositorio.findOne({ where: { id, activo: true } });
    if (!cliente) {
      throw new NotFoundException(`No se encontró el cliente con id ${id}.`);
    }

    await this.repositorioValores.delete({ clienteId: id });
    await this.guardarValores(id, dto.valores);
    return this.obtenerPorId(id);
  }

  async eliminar(id: number): Promise<void> {
    const cliente = await this.repositorio.findOne({ where: { id, activo: true } });
    if (!cliente) {
      throw new NotFoundException(`No se encontró el cliente con id ${id}.`);
    }
    await this.repositorio.update(id, { activo: false });
  }

  private async guardarValores(clienteId: number, valores: GuardarClienteDto['valores']): Promise<void> {
    for (const { campoId, valor } of valores) {
      if (valor == null || valor === '') {
        continue; // no persistimos valores vacíos (un campo no obligatorio, sin completar)
      }
      const fila = this.repositorioValores.create({ clienteId, campoId, valor: String(valor) });
      await this.repositorioValores.save(fila);
    }
  }

  private async validarObligatorios(dto: GuardarClienteDto): Promise<void> {
    const campos = await this.camposFichaClienteService.listarTodas();
    const obligatorios = campos.filter((campo) => campo.obligatorio);

    const faltantes = obligatorios.filter((campo) => {
      const valor = dto.valores.find((v) => v.campoId === campo.id)?.valor;
      return valor == null || String(valor).trim() === '';
    });

    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Faltan campos obligatorios: ${faltantes.map((campo) => campo.nombre).join(', ')}.`,
      );
    }
  }

  /** IDs de cliente cuyos campos "buscador" contienen el texto buscado. `null` = no hay campos buscador configurados (no se puede filtrar). */
  private async buscarIdsPorTexto(texto: string): Promise<number[] | null> {
    const campos = await this.camposFichaClienteService.listarTodas();
    const idsBuscador = campos.filter((campo) => campo.esBuscador).map((campo) => campo.id);
    if (idsBuscador.length === 0) {
      return null;
    }

    const filas = await this.repositorioValores
      .createQueryBuilder('valor')
      .select('DISTINCT valor.cliente_id', 'clienteId')
      .where('valor.campo_id IN (:...ids)', { ids: idsBuscador })
      .andWhere('valor.valor LIKE :texto', { texto: `%${texto}%` })
      .getRawMany<{ clienteId: number }>();

    return filas.map((fila) => Number(fila.clienteId));
  }

  private async cargarConValores(ids: number[]): Promise<ClienteConValores[]> {
    if (ids.length === 0) {
      return [];
    }

    const clientes = await this.repositorio.find({
      where: { id: In(ids) },
      relations: { valores: { campo: true } },
    });

    const porId = new Map(clientes.map((cliente) => [cliente.id, cliente]));
    return ids
      .map((id) => porId.get(id))
      .filter((cliente): cliente is Cliente => !!cliente)
      .map((cliente) => this.mapear(cliente));
  }

  private mapear(cliente: Cliente): ClienteConValores {
    const valores = (cliente.valores ?? []).filter((v) => v.activo);

    return {
      id: cliente.id,
      creadoEn: cliente.creadoEn,
      actualizadoEn: cliente.actualizadoEn,
      activo: cliente.activo,
      valores: valores.map((v) => ({ campoId: v.campoId, valor: v.valor })),
      etiqueta: this.construirEtiqueta(valores),
    };
  }

  /** Arma una etiqueta legible ("Nombre — Documento") a partir de los campos marcados como buscador; si no hay, usa los primeros valores que encuentre. */
  private construirEtiqueta(valores: ClienteValorCampo[]): string {
    const deBuscador = valores
      .filter((v) => v.campo?.esBuscador)
      .sort((a, b) => a.campoId - b.campoId)
      .map((v) => v.valor);

    if (deBuscador.length > 0) {
      return deBuscador.join(' — ');
    }

    const primeros = valores.slice(0, 2).map((v) => v.valor);
    return primeros.length > 0 ? primeros.join(' — ') : 'Cliente sin datos';
  }
}
