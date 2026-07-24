import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Columnas base que heredan todas las entidades del dominio: clave primaria
 * autoincremental, auditoría temporal y baja lógica.
 *
 * Es el equivalente, del lado del backend, de `EntidadBase` en el frontend
 * (`shared/models/entidad-base.model.ts`). Se mantiene el mismo nombre y el
 * mismo criterio (baja lógica en vez de DELETE físico) para que el modelo
 * de datos sea consistente en toda la aplicación.
 */
export abstract class EntidadBase {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  @Column({ default: true })
  activo: boolean;
}
