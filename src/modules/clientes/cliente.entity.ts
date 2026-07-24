import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntidadBase } from '../../common/entities/entidad-base.entity';
import { CampoFichaCliente } from '../campos-ficha-cliente/campo-ficha-cliente.entity';

/**
 * Cliente. A partir de ahora la ficha es 100% dinámica: los datos que se
 * le piden a un cliente (nombre, documento, lo que sea) no son columnas
 * fijas acá, sino que surgen de `CampoFichaCliente` (ver ese módulo) +
 * los valores cargados en `ClienteValorCampo`. Tabla `clientes` casi vacía
 * a propósito: es solo el "contenedor" al que cuelgan los valores.
 */
@Entity('clientes')
export class Cliente extends EntidadBase {
  @OneToMany(() => ClienteValorCampo, (valor) => valor.cliente, { cascade: true })
  valores: ClienteValorCampo[];
}

/**
 * Valor concreto que un cliente tiene cargado para un campo de la ficha.
 * Tabla de relación `cliente_valores_campo` (`cliente_id` FK, `campo_id`
 * FK hacia `campos_ficha_cliente`). Se guarda todo como texto (`valor`)
 * para simplificar, sea cual sea el `tipo` del campo (texto/número/fecha/etc.):
 * la validación de formato la hace la UI según `campo.tipo`.
 */
@Entity('cliente_valores_campo')
export class ClienteValorCampo extends EntidadBase {
  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.valores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'campo_id' })
  campoId: number;

  @ManyToOne(() => CampoFichaCliente)
  @JoinColumn({ name: 'campo_id' })
  campo: CampoFichaCliente;

  @Column({ type: 'text' })
  valor: string;
}
