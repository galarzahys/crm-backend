import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../common/crud.service';
import { GuardarAtributoDto } from './atributo.dto';
import { Atributo, AtributoOpcion } from './entities/atributo.entity';

@Injectable()
export class AtributosService extends CrudService<Atributo> {
  constructor(
    @InjectRepository(Atributo) repositorio: Repository<Atributo>,
    @InjectRepository(AtributoOpcion) private readonly repositorioOpciones: Repository<AtributoOpcion>,
  ) {
    super(repositorio, 'atributo');
  }

  /** Lista los atributos activos junto con sus opciones (si son de tipo `opciones`). */
  async listarConOpciones(): Promise<Atributo[]> {
    return this.repositorio.find({
      where: { activo: true } as any,
      relations: { opciones: true },
      order: { nombre: 'ASC' } as any,
    });
  }

  async crearConOpciones(dto: GuardarAtributoDto): Promise<Atributo> {
    const atributo = await this.crear({ nombre: dto.nombre, unidadMedida: dto.unidadMedida ?? null, tipo: dto.tipo });
    await this.reemplazarOpciones(atributo.id, dto.tipo === 'opciones' ? (dto.opciones ?? []) : []);
    return this.obtenerConOpciones(atributo.id);
  }

  async actualizarConOpciones(id: number, dto: GuardarAtributoDto): Promise<Atributo> {
    await this.actualizar(id, { nombre: dto.nombre, unidadMedida: dto.unidadMedida ?? null, tipo: dto.tipo });
    await this.reemplazarOpciones(id, dto.tipo === 'opciones' ? (dto.opciones ?? []) : []);
    return this.obtenerConOpciones(id);
  }

  private async obtenerConOpciones(id: number): Promise<Atributo> {
    const atributo = await this.repositorio.findOne({ where: { id } as any, relations: { opciones: true } });
    return atributo as Atributo;
  }

  /** Da de baja las opciones anteriores del atributo y crea las nuevas (mismo criterio que en el frontend). */
  private async reemplazarOpciones(atributoId: number, textosOpciones: string[]): Promise<void> {
    const actuales = await this.repositorioOpciones.find({ where: { atributoId, activo: true } as any });
    for (const opcion of actuales) {
      await this.repositorioOpciones.update(opcion.id, { activo: false });
    }

    const textosValidos = textosOpciones.map((texto) => texto.trim()).filter((texto) => texto.length > 0);
    for (const valor of textosValidos) {
      const nueva = this.repositorioOpciones.create({ atributoId, valor, activo: true });
      await this.repositorioOpciones.save(nueva);
    }
  }
}
