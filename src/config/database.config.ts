import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Configuración de base de datos, controlada 100% por variables de entorno
 * (ver `.env.example`). Soporta dos motores:
 *
 * - `DB_TYPE=sqlite` (default): guarda todo en un archivo local
 *   (`DB_SQLITE_PATH`, por defecto `./data/gestion-app.sqlite`). Cero
 *   configuración: sirve para levantar el backend sin tener nada más
 *   instalado.
 * - `DB_TYPE=mysql`: se conecta a un MySQL real vía `DB_HOST`, `DB_PORT`,
 *   `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`. Sirve tanto para el MySQL
 *   que ya tenés corriendo en Docker en local, como para la instancia en
 *   la EC2 de test, como para RDS más adelante — es el mismo driver
 *   (`mysql2`) en los tres casos, así que pasar de uno a otro es
 *   únicamente cambiar estas variables, sin tocar código.
 *
 * `synchronize` (que crea/actualiza las tablas automáticamente a partir de
 * las entidades) está pensado para desarrollo. Para producción, la idea a
 * futuro es pasar a migraciones versionadas de TypeORM en vez de confiar
 * en `synchronize` (ver README, sección "De acá en más").
 */
export const databaseConfig = registerAs('database', (): TypeOrmModuleOptions => {
  const tipo = process.env.DB_TYPE ?? 'sqlite';
  const sincronizar = (process.env.DB_SYNCHRONIZE ?? 'true') === 'true';

  if (tipo === 'mysql') {
    return {
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? 'gestion_app',
      autoLoadEntities: true,
      synchronize: sincronizar,
      logging: (process.env.DB_LOGGING ?? 'false') === 'true',
      timezone: 'Z',
    };
  }

  // SQLite (default): un único archivo, sin dependencias externas ni
  // compilación nativa (usa sql.js, que es SQLite compilado a WebAssembly
  // puro — funciona igual en Windows, Mac y Linux sin instalar nada extra
  // como Visual Studio Build Tools o Python).
  return {
    type: 'sqljs',
    autoSave: true,
    location: process.env.DB_SQLITE_PATH ?? './data/gestion-app.sqlite',
    autoLoadEntities: true,
    synchronize: sincronizar,
    logging: (process.env.DB_LOGGING ?? 'false') === 'true',
  };
});
