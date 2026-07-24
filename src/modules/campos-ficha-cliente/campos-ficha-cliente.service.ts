import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { GuardarCampoFichaClienteDto } from './campo-ficha-cliente.dto';
import { CampoFichaCliente } from './campo-ficha-cliente.entity';

const LIMITE_CAMPOS_BUSCADOR = 2;

@Injectable()
export class CamposFichaClienteService extends CrudService<CampoFichaCliente> {
  constructor(@InjectRepository(CampoFichaCliente) repositorio: Repository<CampoFichaCliente>) {
    super(repositorio, 'campo');
  }

  override async listarTodas(): Promise<CampoFichaCliente[]> {
    return this.repositorio.find({ where: { activo: true } as any, order: { id: 'ASC' } as any });
  }

  async crearCampo(dto: GuardarCampoFichaClienteDto): Promise<CampoFichaCliente> {
    await this.validarLimiteBuscador(dto.esBuscador);
    const clave = await this.generarClaveUnica(dto.nombre);
    return this.crear({ nombre: dto.nombre, clave, tipo: dto.tipo, obligatorio: dto.obligatorio, esBuscador: dto.esBuscador });
  }

  async actualizarCampo(id: number, dto: GuardarCampoFichaClienteDto): Promise<CampoFichaCliente> {
    await this.validarLimiteBuscador(dto.esBuscador, id);
    // La "clave" no se regenera en la edición: es un identificador estable,
    // aunque el usuario le cambie la etiqueta (`nombre`) después.
    return this.actualizar(id, {
      nombre: dto.nombre,
      tipo: dto.tipo,
      obligatorio: dto.obligatorio,
      esBuscador: dto.esBuscador,
    });
  }

  /** Como mucho `LIMITE_CAMPOS_BUSCADOR` campos activos pueden estar marcados para el buscador a la vez. */
  private async validarLimiteBuscador(esBuscador: boolean, idAExcluir?: number): Promise<void> {
    if (!esBuscador) {
      return;
    }
    const marcados = await this.repositorio.find({ where: { esBuscador: true, activo: true } as any });
    const otros = marcados.filter((campo) => campo.id !== idAExcluir);
    if (otros.length >= LIMITE_CAMPOS_BUSCADOR) {
      throw new BadRequestException(
        `Ya hay ${LIMITE_CAMPOS_BUSCADOR} campos marcados para el buscador. Desmarcá uno antes de agregar otro.`,
      );
    }
  }

  private async generarClaveUnica(nombre: string): Promise<string> {
    const base = this.normalizarClave(nombre);
    let candidata = base;
    let sufijo = 2;
    while (await this.repositorio.findOne({ where: { clave: candidata } as any })) {
      candidata = `${base}_${sufijo}`;
      sufijo += 1;
    }
    return candidata;
  }

  private normalizarClave(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // saca acentos (María -> Maria)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'campo';
  }
}
