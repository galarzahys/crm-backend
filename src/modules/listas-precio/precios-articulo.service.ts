import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefinirValorDto } from './lista-precio.dto';
import { PrecioArticulo, PrecioArticuloHistorial } from './entities/lista-precio.entity';

@Injectable()
export class PreciosArticuloService {
  constructor(
    @InjectRepository(PrecioArticulo) private readonly repositorio: Repository<PrecioArticulo>,
    @InjectRepository(PrecioArticuloHistorial) private readonly repositorioHistorial: Repository<PrecioArticuloHistorial>,
  ) {}

  /** Precios vigentes de todos los artículos de una lista. */
  async listarVigentesDeLista(listaPrecioId: number): Promise<PrecioArticulo[]> {
    return this.repositorio.find({ where: { listaPrecioId, activo: true } });
  }

  /** Historial de valores reemplazados de un artículo en una lista, del más reciente al más antiguo. */
  async historialDe(listaPrecioId: number, articuloId: number): Promise<PrecioArticuloHistorial[]> {
    return this.repositorioHistorial.find({
      where: { listaPrecioId, articuloId },
      order: { vigenteHasta: 'DESC' },
    });
  }

  /**
   * Define (da de alta o actualiza) el valor de venta de un artículo en una
   * lista. Si ya había un valor vigente, lo pasa a `precios_articulo_historial`
   * (con su fecha de vigencia original y `vigenteHasta` = ahora) antes de
   * grabar el valor nuevo. Misma lógica que `PrecioArticuloService.definirValor`
   * del frontend, ahora contra la base real.
   */
  async definirValor(listaPrecioId: number, articuloId: number, dto: DefinirValorDto): Promise<PrecioArticulo> {
    const actual = await this.repositorio.findOne({ where: { listaPrecioId, articuloId, activo: true } });
    const ahora = new Date();

    if (!actual) {
      const nuevo = this.repositorio.create({
        listaPrecioId,
        articuloId,
        moneda: dto.moneda,
        valor: dto.valor,
        vigenteDesde: ahora,
        activo: true,
      });
      return this.repositorio.save(nuevo);
    }

    const historico = this.repositorioHistorial.create({
      listaPrecioId,
      articuloId,
      moneda: actual.moneda,
      valor: actual.valor,
      vigenteDesde: actual.vigenteDesde,
      vigenteHasta: ahora,
      activo: true,
    });
    await this.repositorioHistorial.save(historico);

    actual.moneda = dto.moneda;
    actual.valor = dto.valor;
    actual.vigenteDesde = ahora;
    return this.repositorio.save(actual);
  }
}
