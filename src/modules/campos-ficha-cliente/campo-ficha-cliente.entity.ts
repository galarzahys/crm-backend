import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';

export type TipoCampoFicha = 'texto' | 'numero' | 'fecha' | 'email' | 'telefono';

/**
 * Definición de un campo de la ficha de registro de cliente. El usuario
 * arma su propia ficha agregando estos registros: qué datos pedir, si son
 * obligatorios, y si aparecen como criterio del buscador de clientes
 * (como máximo 2 a la vez — ver `CamposFichaClienteService`).
 *
 * Tabla `campos_ficha_cliente` en el esquema relacional. Guarda solo la
 * **definición** del campo; los valores que cada cliente carga en esos
 * campos son un paso siguiente (tabla de relación `cliente_valores_campo`,
 * análoga a `articulo_atributos`) que todavía no está construido — hoy el
 * objetivo es que el usuario pueda diseñar la ficha libremente.
 */
@Entity('campos_ficha_cliente')
export class CampoFichaCliente extends EntidadBase {
  @Column()
  nombre: string;

  /** Identificador estable derivado de `nombre` (ej: "Fecha de nacimiento" -> "fecha_de_nacimiento"). No cambia si se edita el nombre después. */
  @Column({ unique: true })
  clave: string;

  @Column({ type: 'varchar' })
  tipo: TipoCampoFicha;

  @Column({ default: false })
  obligatorio: boolean;

  @Column({ name: 'es_buscador', default: false })
  esBuscador: boolean;
}
