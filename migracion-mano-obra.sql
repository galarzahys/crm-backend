-- ============================================================================
-- Migración: separar Mano de obra de Materiales, categorías de material
-- con árbol, y costeo compartido (recursos_costo).
--
-- CÓMO CORRERLO (ver también MIGRACION-EC2.md):
--   1) Backup ya hecho (data/gestion-app-backup-YYYYMMDD.sqlite) — confirmalo antes de seguir.
--   2) Probar primero contra una COPIA:
--        cp data/gestion-app.sqlite data/gestion-app-prueba.sqlite
--        sqlite3 data/gestion-app-prueba.sqlite < migracion-mano-obra.sql
--      Revisar los SELECT de verificación que aparecen entre fases.
--   3) Si todo cierra, recién ahí correrlo contra la base real:
--        sqlite3 data/gestion-app.sqlite < migracion-mano-obra.sql
--   4) Recién después de esto, actualizar el código del backend (el que ya
--      tenés) y reiniciar. `synchronize` va a terminar de acomodar índices/
--      foreign keys menores, pero los datos ya van a estar en su lugar.
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- FASE 1 — Crear las tablas nuevas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "categorias_material" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "creado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "actualizado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "activo" boolean NOT NULL DEFAULT (1),
  "nombre" varchar NOT NULL,
  "padre_id" integer
);

CREATE TABLE IF NOT EXISTS "mano_de_obra" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "creado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "actualizado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "activo" boolean NOT NULL DEFAULT (1),
  "nombre" varchar NOT NULL,
  "unidad_medida" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "recursos_costo" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "creado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "actualizado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "activo" boolean NOT NULL DEFAULT (1),
  "tipo_recurso" varchar NOT NULL,
  "recurso_id" integer NOT NULL,
  "moneda" varchar NOT NULL,
  "valor" decimal NOT NULL,
  "vigente_desde" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "recursos_costo_historial" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "creado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "actualizado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "activo" boolean NOT NULL DEFAULT (1),
  "tipo_recurso" varchar NOT NULL,
  "recurso_id" integer NOT NULL,
  "moneda" varchar NOT NULL,
  "valor" decimal NOT NULL,
  "vigente_desde" datetime NOT NULL,
  "vigente_hasta" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "articulo_mano_obra" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "creado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "actualizado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "activo" boolean NOT NULL DEFAULT (1),
  "articulo_id" integer NOT NULL,
  "mano_de_obra_id" integer NOT NULL,
  "cantidad" decimal NOT NULL
);

-- ============================================================================
-- FASE 2 — Categorías de material (a partir de los `tipo` que hoy existen)
-- ============================================================================

INSERT INTO categorias_material (nombre) VALUES ('Material');
INSERT INTO categorias_material (nombre) VALUES ('Insumos');

-- Verificación fase 2: deberían aparecer las 2, con id propio.
SELECT * FROM categorias_material;

-- ============================================================================
-- FASE 3 — Migrar los materiales que eran `tipo = 'mano_obra'` a la tabla nueva
-- ============================================================================

INSERT INTO mano_de_obra (nombre, unidad_medida, creado_en, actualizado_en, activo)
SELECT nombre, unidad_medida, creado_en, actualizado_en, activo
FROM materiales WHERE tipo = 'mano_obra';

-- Verificación fase 3: tiene que traer la misma cantidad que
-- "SELECT COUNT(*) FROM materiales WHERE tipo='mano_obra'" (2, según lo que viste).
SELECT * FROM mano_de_obra;

-- ============================================================================
-- FASE 4 — Migrar costo vigente + historial de TODOS los materiales
-- (mano de obra con tipo_recurso='mano_obra', el resto con 'material')
-- ============================================================================

-- Costo vigente de lo que pasó a ser mano de obra
INSERT INTO recursos_costo (tipo_recurso, recurso_id, moneda, valor, vigente_desde, creado_en, actualizado_en, activo)
SELECT 'mano_obra', mo.id, mc.moneda, mc.valor, mc.vigente_desde, mc.creado_en, mc.actualizado_en, mc.activo
FROM materiales_costo mc
JOIN materiales m ON m.id = mc.material_id AND m.tipo = 'mano_obra'
JOIN mano_de_obra mo ON mo.nombre = m.nombre AND mo.unidad_medida = m.unidad_medida
WHERE mc.activo = 1;

-- Historial de lo que pasó a ser mano de obra
INSERT INTO recursos_costo_historial (tipo_recurso, recurso_id, moneda, valor, vigente_desde, vigente_hasta, creado_en, actualizado_en, activo)
SELECT 'mano_obra', mo.id, mch.moneda, mch.valor, mch.vigente_desde, mch.vigente_hasta, mch.creado_en, mch.actualizado_en, mch.activo
FROM materiales_costo_historial mch
JOIN materiales m ON m.id = mch.material_id AND m.tipo = 'mano_obra'
JOIN mano_de_obra mo ON mo.nombre = m.nombre AND mo.unidad_medida = m.unidad_medida;

-- Costo vigente de lo que sigue siendo material (tipo='material' o 'insumos')
INSERT INTO recursos_costo (tipo_recurso, recurso_id, moneda, valor, vigente_desde, creado_en, actualizado_en, activo)
SELECT 'material', mc.material_id, mc.moneda, mc.valor, mc.vigente_desde, mc.creado_en, mc.actualizado_en, mc.activo
FROM materiales_costo mc
JOIN materiales m ON m.id = mc.material_id AND m.tipo != 'mano_obra'
WHERE mc.activo = 1;

-- Historial de lo que sigue siendo material
INSERT INTO recursos_costo_historial (tipo_recurso, recurso_id, moneda, valor, vigente_desde, vigente_hasta, creado_en, actualizado_en, activo)
SELECT 'material', mch.material_id, mch.moneda, mch.valor, mch.vigente_desde, mch.vigente_hasta, mch.creado_en, mch.actualizado_en, mch.activo
FROM materiales_costo_historial mch
JOIN materiales m ON m.id = mch.material_id AND m.tipo != 'mano_obra';

-- Verificación fase 4: comparar contra los totales originales.
SELECT COUNT(*) AS costos_vigentes_migrados FROM recursos_costo;
SELECT COUNT(*) AS historial_migrado FROM recursos_costo_historial;
SELECT (SELECT COUNT(*) FROM materiales_costo WHERE activo = 1) AS costos_vigentes_originales;
SELECT (SELECT COUNT(*) FROM materiales_costo_historial) AS historial_original;

-- ============================================================================
-- FASE 5 — Migrar la composición de artículos que usaba mano de obra
-- (estaba en articulo_componentes, mezclada con materiales de verdad)
-- ============================================================================

INSERT INTO articulo_mano_obra (articulo_id, mano_de_obra_id, cantidad, creado_en, actualizado_en, activo)
SELECT ac.articulo_id, mo.id, ac.cantidad, ac.creado_en, ac.actualizado_en, ac.activo
FROM articulo_componentes ac
JOIN materiales m ON m.id = ac.material_id AND m.tipo = 'mano_obra'
JOIN mano_de_obra mo ON mo.nombre = m.nombre AND mo.unidad_medida = m.unidad_medida;

-- Verificación fase 5: cantidad de filas movidas.
SELECT COUNT(*) AS filas_movidas_a_mano_de_obra FROM articulo_mano_obra;

-- Ahora sí, borrar esas filas de articulo_componentes (ya están migradas)
DELETE FROM articulo_componentes
WHERE material_id IN (SELECT id FROM materiales WHERE tipo = 'mano_obra');

-- Verificación: articulo_componentes + articulo_mano_obra debería sumar el
-- total original de articulo_componentes (24, según lo que viste).
SELECT
  (SELECT COUNT(*) FROM articulo_componentes) +
  (SELECT COUNT(*) FROM articulo_mano_obra) AS total_despues_de_separar;

-- ============================================================================
-- FASE 6 — Reconstruir la tabla `materiales` con la forma final
-- (categoria_id en vez de tipo; sin los que ya son mano de obra)
-- ============================================================================

CREATE TABLE "materiales_nueva" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "creado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "actualizado_en" datetime NOT NULL DEFAULT (datetime('now')),
  "activo" boolean NOT NULL DEFAULT (1),
  "nombre" varchar NOT NULL,
  "categoria_id" integer NOT NULL,
  "unidad_medida" varchar NOT NULL
);

INSERT INTO materiales_nueva (id, creado_en, actualizado_en, activo, nombre, categoria_id, unidad_medida)
SELECT
  m.id, m.creado_en, m.actualizado_en, m.activo, m.nombre,
  CASE m.tipo
    WHEN 'material' THEN (SELECT id FROM categorias_material WHERE nombre = 'Material')
    WHEN 'insumos'  THEN (SELECT id FROM categorias_material WHERE nombre = 'Insumos')
  END AS categoria_id,
  m.unidad_medida
FROM materiales m
WHERE m.tipo != 'mano_obra';

-- Verificación fase 6: no debería quedar NINGUNA fila con categoria_id nulo.
SELECT COUNT(*) AS filas_sin_categoria FROM materiales_nueva WHERE categoria_id IS NULL;
-- Y la cantidad total tiene que dar 11 (los 5 'material' + 6 'insumos' que ya tenías).
SELECT COUNT(*) AS total_materiales_migrados FROM materiales_nueva;

-- Si las dos verificaciones de arriba están OK (0 sin categoría, 11 en total),
-- recién ahí reemplazamos la tabla vieja por la nueva:
DROP TABLE materiales;
ALTER TABLE materiales_nueva RENAME TO materiales;

-- Y borramos las tablas de costeo viejas (ya migradas a recursos_costo en la Fase 4)
DROP TABLE materiales_costo;
DROP TABLE materiales_costo_historial;

-- ============================================================================
-- FASE 7 — Actualizar el JSON congelado de costos en los presupuestos
-- (tipo -> origen; 'material'/'insumos' -> 'material', 'mano_obra' se mantiene)
-- ============================================================================

UPDATE presupuesto_items
SET costo_detallado = REPLACE(
  REPLACE(
    REPLACE(costo_detallado, '"tipo":"material"', '"origen":"material"'),
    '"tipo":"insumos"', '"origen":"material"'
  ),
  '"tipo":"mano_obra"', '"origen":"mano_obra"'
)
WHERE costo_detallado IS NOT NULL;

-- Verificación fase 7: no debería quedar ningún rastro de la palabra "tipo" en el JSON.
SELECT COUNT(*) AS items_con_tipo_viejo_sin_migrar
FROM presupuesto_items
WHERE costo_detallado LIKE '%"tipo":%';

-- Y de paso, confirmar que el total de items con costo_detallado no cambió (7).
SELECT COUNT(*) AS items_con_costo_detallado
FROM presupuesto_items WHERE costo_detallado IS NOT NULL;

PRAGMA foreign_keys = ON;

-- ============================================================================
-- FIN — revisar los resultados de todos los SELECT antes de dar por buena
-- la migración. Si algo no cierra, NO seguir: restaurar el backup y avisar.
-- ============================================================================
