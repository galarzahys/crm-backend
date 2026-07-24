# Gestión App API

Backend en **NestJS + TypeScript + TypeORM** para la persistencia de los datos de Gestión App (artículos, atributos, categorías, clientes, vendedores, listas de precios y presupuestos), hoy resueltos en cache en el frontend Angular.

## Índice

- [Cómo correrlo en local](#cómo-correrlo-en-local)
- [Los 4 escenarios de base de datos](#los-4-escenarios-de-base-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Endpoints](#endpoints)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Deploy a EC2 (test)](#deploy-a-ec2-test)
- [Conectar a RDS más adelante](#conectar-a-rds-más-adelante)
- [Próximos pasos](#próximos-pasos)

## Cómo correrlo en local

```bash
npm install
cp .env.example .env   # ya viene con DB_TYPE=sqlite, no hace falta tocar nada
npm run start:dev
```

Con eso ya tenés la API arriba en `http://localhost:3000`, con las categorías, clientes y vendedores de ejemplo sembrados automáticamente al arrancar (mismos datos mock que ya tenía el frontend). Documentación interactiva (Swagger) en `http://localhost:3000/api/docs`.

### Si `npm run start:dev` da error "'nest' is not recognized" (Windows)

Eso pasa cuando `npm install` no terminó de instalar `node_modules` correctamente (el binario de `@nestjs/cli` vive ahí). Soluciones, en orden:

1. Corré `npm install` de nuevo y prestá atención a si corta con algún error en rojo (no solo warnings).
2. Confirmá que existe `node_modules\.bin\nest.cmd`. Si no está, `node_modules` quedó incompleto — borralo (`rmdir /s /q node_modules` en PowerShell) y volvé a instalar.
3. Como alternativa rápida mientras tanto: `npx nest start --watch`.

Si en algún momento se vuelve a usar una dependencia con compilación nativa (no debería hacer falta con el driver actual), en Windows eso requiere tener instalado "Desktop development with C++" (Visual Studio Build Tools) + Python — por eso el driver de SQLite elegido acá (`sql.js`) es WebAssembly puro y no necesita nada de eso.

## Los 4 escenarios de base de datos

Todo se controla por variables de entorno (`.env`), sin tocar código. La pieza clave es `src/config/database.config.ts`.

### 1. Local, sin nada instalado (SQLite)

Es el default (`DB_TYPE=sqlite`). Guarda todo en un archivo (`data/gestion-app.sqlite`, ignorado por git), usando **sql.js** (SQLite compilado a WebAssembly puro) — a propósito, para no depender de compilación nativa (node-gyp, Visual Studio Build Tools, Python) en ninguna plataforma, Windows incluido.

```env
DB_TYPE=sqlite
DB_SQLITE_PATH=./data/gestion-app.sqlite
```

Para arrancar de cero, borrá el archivo: `rm data/gestion-app.sqlite` (o borralo a mano en Windows).

### 2. Local, contra tu MySQL de Docker

Cambiá el `.env` a:

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_DATABASE=gestion_app
```

Importante: la base (`gestion_app` o el nombre que seas) tiene que existir de antes — TypeORM crea las *tablas* (por `synchronize`), pero no la base en sí. Si tu contenedor de Docker no la tiene, creála una vez:

```bash
docker exec -it <nombre_o_id_del_contenedor_mysql> mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS gestion_app;"
```

### 3. EC2 de test (sin RDS todavía)

Mismo build, mismo `.env`, apuntando a un MySQL que corra en esa EC2 (contenedor Docker propio, o instalado directo). Es exactamente el mismo escenario que el punto 2, solo que `DB_HOST` deja de ser `localhost` (o sigue siéndolo, si el MySQL corre en la misma instancia) — no cambia nada de código.

```bash
npm run build
NODE_ENV=production node dist/main.js
```

Para que sobreviva a un reinicio de la instancia, usá `pm2` o un servicio de `systemd` (podemos armar el `.service` cuando lleguemos a ese paso).

### 4. RDS, más adelante

Cuando decidas migrar la base a RDS: creás la instancia MySQL en RDS, y en el `.env` de la EC2 cambiás únicamente `DB_HOST` (al endpoint de RDS), `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE`. **Cero cambios de código** — es el mismo driver (`mysql2`) apuntando a otro host. Los únicos puntos a resolver en ese momento son de infraestructura, no de aplicación:

- Security group de RDS: permitir el puerto 3306 solo desde el security group de la EC2 (nunca `0.0.0.0/0`).
- RDS en subnet privada, sin acceso público.
- Credenciales en **AWS Secrets Manager** o **SSM Parameter Store** en vez de en el `.env` plano, si querés subir el nivel de seguridad antes de ir a producción real.

## Estructura del proyecto

```
src/
  common/
    crud.service.ts              # CRUD genérico (paginado, búsqueda, baja lógica) — equivalente
                                  # de backend del CacheRepository<T> del frontend
    entities/entidad-base.entity.ts  # id, creadoEn, actualizadoEn, activo — igual a EntidadBase del frontend
    dto/paginacion-query.dto.ts  # mismos parámetros que ParametrosConsulta del frontend
    interfaces/resultado-paginado.interface.ts
  config/
    database.config.ts           # el switch sqlite/mysql descripto arriba
  modules/
    categorias/
    atributos/                   # incluye AtributoOpcion
    articulos/                   # incluye ArticuloAtributo (tabla de relación)
    clientes/                    # con seed + búsqueda por nombre/documento
    vendedores/                  # con seed
    listas-precio/               # incluye PrecioArticulo + PrecioArticuloHistorial
    presupuestos/                # incluye PresupuestoItem
  app.module.ts
  main.ts                        # CORS, ValidationPipe global, Swagger
```

Cada módulo sigue el mismo patrón: `*.entity.ts` (TypeORM), `*.dto.ts` (class-validator), `*.service.ts` (extiende `CrudService` + lógica propia si la tiene), `*.controller.ts`, `*.module.ts`. Es la misma organización por feature que ya tenés en el Angular (`features/articulos`, `features/atributos`, etc.), para que sea fácil ubicarse saltando de uno a otro.

## Endpoints

| Recurso | Rutas |
|---|---|
| Categorías | `GET/POST /categorias`, `PUT/DELETE /categorias/:id` |
| Atributos | `GET/POST /atributos` (incluye opciones), `PUT/DELETE /atributos/:id` |
| Artículos | `GET /articulos?pagina=&tamanio=&busqueda=&categoriaId=`, `GET/POST/PUT/DELETE /articulos/:id` |
| Clientes | `GET /clientes?busqueda=` (nombre o documento) |
| Vendedores | `GET /vendedores` |
| Listas de precio | `GET/POST /listas-precio`, `PUT/DELETE /listas-precio/:id` |
| Precios | `GET /listas-precio/:id/precios`, `PUT /listas-precio/:id/precios/:articuloId` (define el valor y mueve el anterior a historial), `GET /listas-precio/:id/precios/:articuloId/historial` |
| Presupuestos | `GET /presupuestos`, `GET /presupuestos/:id`, `POST /presupuestos` |
| Salud | `GET /salud` |

Todos los listados paginados devuelven `{ datos, total, pagina, tamanio }`, igual que `ResultadoPaginado<T>` en el frontend.

## Decisiones de diseño

- **Baja lógica en todos lados** (`activo: false`), nunca `DELETE` físico — mismo criterio que en el frontend, para no romper integridad referencial.
- **Columnas de tipo/enum como `varchar`** (no enum nativo de columna): los enums de MySQL y SQLite se comportan distinto en TypeORM, y como el objetivo es poder correr contra los dos motores sin fricción, se optó por `varchar` + validación de `class-validator` en los DTOs. El tipo de TypeScript sigue dando seguridad en el código igual.
- **Historial de precios**: `PreciosArticuloService.definirValor()` replica exactamente la lógica que ya habíamos armado en el frontend (`PrecioArticuloService`): si hay un valor vigente, se copia a `precios_articulo_historial` con su `vigenteDesde` original y `vigenteHasta = ahora`, recién después se pisa el valor vigente.
- **Presupuestos con snapshot de precio**: `PresupuestoItem` guarda precio, moneda, lista usada y descuento **congelados** al momento de crear el presupuesto — no se recalculan si después cambia el precio de lista, igual que en el frontend.
- **`synchronize: true`** (crea/actualiza tablas automáticamente a partir de las entidades) está pensado para esta etapa de desarrollo. Antes de ir a producción con datos reales, conviene pasar a migraciones versionadas de TypeORM (`typeorm migration:generate` / `migration:run`) para tener control fino sobre los cambios de esquema — lo dejamos anotado en "Próximos pasos".
- **Imágenes de artículos**: `imagenKey` e `imagenUrlVisualizacion` ya están como columnas en `Articulo`, pero todavía no hay endpoint que genere URLs prefirmadas de S3 — es el próximo módulo a conectar (ver "Próximos pasos").

### Nota sobre búsqueda de texto (SQLite vs MySQL)

`LIKE` se comporta un poco distinto entre motores: MySQL, con la collation por defecto (`utf8mb4_general_ci` o similar), ignora mayúsculas/minúsculas y a veces acentos; SQLite ignora mayúsculas/minúsculas en ASCII pero **no** en caracteres acentuados (buscar "maria" no encuentra "María" en SQLite, pero si buscás "María" tal cual, sí). Para desarrollo local no debería ser un problema; si en algún momento pasa a molestar, se soluciona agregando una extensión de collation unicode en SQLite o normalizando el texto de búsqueda en el backend antes de compararlo.

## Deploy a EC2 (test)

```bash
npm run build
npm ci --omit=dev        # o npm install --omit=dev, en la instancia
NODE_ENV=production PORT=3000 node dist/main.js
```

Con un `.env` en el servidor apuntando a `DB_TYPE=mysql` (ver escenario 3 arriba). Recomendado ponerlo detrás de Nginx como reverse proxy (con el certificado TLS ahí) en vez de exponer el puerto 3000 directo.

## Conectar a RDS más adelante

Ver el escenario 4 arriba: es un cambio de 4 variables de entorno (`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`), sin ningún cambio de código.

## Próximos pasos

- Endpoint de imágenes: generación de URL prefirmada de subida (S3), y de lectura, para conectar con la lógica que ya está preparada en el frontend (`ALMACENAMIENTO_IMAGENES` / `AlmacenamientoImagenesCacheService`).
- Migraciones de TypeORM en vez de `synchronize: true`, antes de tener datos reales en producción.
- Autenticación/autorización (hoy no hay ningún endpoint protegido).
- Conectar el frontend Angular reemplazando cada `CacheRepository` por un `HttpClient` que apunte a esta API (la forma de los datos y de la paginación ya es la misma a propósito, así que el cambio debería ser bastante mecánico).
