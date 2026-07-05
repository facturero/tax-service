# tax-service — Guía de implementación (para opencode)

> **Objetivo.** Construir `tax-service`: la **fuente de verdad fiscal** de la plataforma. Dueño de los catálogos por país: **países**, **tasas de impuesto**, **tipos de identificación** y **tipos de comprobante**. Node + TS + Hono + Sequelize, **misma plantilla que `../auth-service/` y `../organization-service/`**.
>
> **Clave — dato de PLATAFORMA, no de tenant.** A diferencia del resto de servicios, tax **NO** aísla por `organization_id`: sus catálogos son globales, compartidos por todas las organizaciones, **particionados por `country_code`**. Por eso los reads no requieren `X-Organization-Id` (cualquier usuario autenticado consulta el catálogo de su país); las escrituras son de **administrador de plataforma** (permiso `tax:manage`).
>
> **Rol en el sistema:** tax **publica** eventos cuando cambia un catálogo (`tax.country.enabled`, `tax.tax_rate.upserted`, `tax.identification_type.upserted`, `tax.document_type.upserted`); otros servicios (organization, customer, product, billing) construyen **read-models** locales a partir de ellos. tax **no consume** eventos (es la fuente).
>
> **Contrato:** `openapi.yaml` (REST) y `asyncapi.yaml` (eventos) en esta carpeta son la **fuente de verdad**. Impleméntalos tal cual.

## Reglas de oro

1. **Imita `../auth-service/` y `../organization-service/` archivo por archivo:** entidades (constructor privado + factories + `fromPersistence`/`toPersistence`), errores (`AppError` con `code`/`httpStatus`/`details`, se **lanzan**), repos (interfaz en `domain/`, impl Sequelize factory `(tx?)`, `save`=upsert, agregado `Repositories` + `UnitOfWork`), modelos (`timestamps:false`, `underscored:true`), controladores factory + `validateJson`, wiring **solo** en `main.ts`, Outbox.
2. **Base propia `tax_db`.** Es la fuente de verdad fiscal; **no** cachea datos de otros servicios.
3. **NO verifica JWT.** Confía en las cabeceras del gateway: `X-User-Id`, `X-Country-Code`, `X-Permissions`. **No usa `X-Organization-Id`** (dato de plataforma).
4. **Autorización:** reads → solo requieren usuario autenticado (`X-User-Id` presente). Writes (crear/actualizar catálogos) → permiso **`tax:manage`** (administrador de plataforma).
5. **Particionado por `country_code`**, no por organización. Los catálogos son únicos por `(country_code, code)`.
6. **Eventos vía Outbox** (misma transacción). Namespace `tax.*`, en pasado. El relay a RabbitMQ es infra compartida (pendiente): por ahora quedan en `outbox_messages`.
7. **El seed emite eventos.** El seed de Ecuador inserta los catálogos **y** las filas de Outbox correspondientes, para que los consumidores (organization, customer…) reciban `tax.country.enabled` y los `*.upserted` cuando el relay corra. (Sin esto, organization seguiría dependiendo de su seed-parche de EC.)
8. Tras cada fase: `npm run typecheck` y `npm test` verdes.

## Fase 1 — Bootstrap

Clona de `../organization-service/`: `tsconfig.json`, `.sequelizerc`, `sequelize.config.cjs`, `.gitignore`, `Dockerfile`, `vitest.config.ts`. `package.json` con las mismas deps (hono, @hono/node-server, @hono/zod-validator, zod, sequelize, mysql2, dotenv; dev: typescript, tsx, vitest, sequelize-cli, @types/node). Scripts idénticos.

`.env.example`:
```
NODE_ENV=development
PORT=3005
DB_HOST=localhost
DB_PORT=3306
DB_USER=tax_user
DB_PASSWORD=secret
DB_NAME=tax_db
CORS_ORIGIN=http://localhost:5173
```

Estructura layer-first: `src/{domain,application/use-cases,infrastructure/persistence,interface/http,shared,__tests__}` + `migrations/`.

- [ ] `npm install && npm run typecheck` OK.

## Fase 2 — Migración + seed EC

Migración `create-tax-tables.js`:

- **`countries`**: `code` PK char(2), `name`, `currency_code` char(3), `decimals` int def 2, `enabled` bool def true.
- **`tax_rates`**: `id` char(36) PK, `country_code` FK→countries CASCADE, `code`, `name`, `percentage` decimal(6,2), `kind` (vat|withholding_iva|withholding_rent|special), `is_default` bool def false. Único `(country_code, code)`.
- **`identification_types`**: `id` PK, `country_code` FK→countries, `code`, `name`, `regex`. Único `(country_code, code)`.
- **`document_types`**: `id` PK, `country_code` FK→countries, `code` (SRI: 01, 04…), `name`. Único `(country_code, code)`.
- **`outbox_messages`**: id, aggregate_type, aggregate_id, type, payload JSON, occurred_at, processed_at. Índice en processed_at.

Migración `seed-ecuador.js` (idempotente). Inserta el catálogo de EC **y** sus eventos en `outbox_messages`:

- `countries`: `EC` (Ecuador, USD, 2, enabled) → Outbox `tax.country.enabled` `{ countryCode:'EC', name:'Ecuador', currencyCode:'USD', decimals:2 }`.
- `tax_rates` (kind=vat): `IVA15` 15.00 (is_default), `IVA0` 0.00, `NO_OBJETO` 0.00 → Outbox `tax.tax_rate.upserted` por cada uno.
- `identification_types`: `RUC` (`^\d{13}$`), `CEDULA` (`^\d{10}$`), `PASAPORTE` (libre), `CONSUMIDOR_FINAL` (`^9{13}$`) → Outbox `tax.identification_type.upserted` por cada uno.
- `document_types`: `01` Factura, `04` Nota de crédito, `05` Nota de débito, `06` Guía de remisión, `07` Comprobante de retención → Outbox `tax.document_type.upserted` por cada uno.

(Usa ids deterministas o uuid; `ON DUPLICATE KEY`/`ignoreDuplicates` para idempotencia.)

- [ ] `npm run db:migrate` limpio; `SELECT count(*) FROM tax_rates` = 3 para EC; hay filas en `outbox_messages`.

## Fase 3 — Dominio (`src/domain/`)

- **`value-objects.ts`**: `CountryCode` (ISO alpha-2 mayúsculas). `Percentage` opcional (0–100).
- **`entities.ts`**: `Country` (code, name, currencyCode, decimals, enabled; `enable()`, `update(...)`). `TaxRate` (id, countryCode, code, name, percentage, kind, isDefault). `IdentificationType` (id, countryCode, code, name, regex). `DocumentType` (id, countryCode, code, name). Todas con `static create` / `fromPersistence` / `toPersistence`.
- **`errors.ts`**: `AppError` + `ValidationError(422)`, `UserContextRequiredError(401)`, `ForbiddenError(403)`, `CountryNotFoundError(404)`, `CountryAlreadyExistsError(409)`, `InvalidCountryCodeError(422)`, `CatalogItemNotFoundError(404)`.
- **`repositories.ts`**: `CountryRepository` (findByCode, listEnabled, listAll, save), `TaxRateRepository` (listByCountry, findByCode(country,code), save), `IdentificationTypeRepository` (listByCountry, findByCode, save), `DocumentTypeRepository` (listByCountry, findByCode, save), `OutboxRepository` (add). `DomainEvent`. Agregado `Repositories`.

- [ ] `typecheck` OK.

## Fase 4 — Persistencia (`src/infrastructure/persistence/`)

`sequelize.ts` (clona). `models.ts`: modelo por tabla (`timestamps:false`, `underscored:true`), asociaciones `Country.hasMany(TaxRate/IdentificationType/DocumentType)`. `repositories.ts`: mappers, factories `(tx?)`, `buildRepositories`, `SequelizeUnitOfWork`. `save` = `upsert`.

- [ ] `typecheck` OK.

## Fase 5 — Casos de uso (`src/application/use-cases/`)

**Lecturas:** `ListCountriesUseCase` (enabled). `GetCountryUseCase(code)` → country o `CountryNotFoundError`. `ListTaxRatesUseCase(countryCode)`. `ListIdentificationTypesUseCase(countryCode)`. `ListDocumentTypesUseCase(countryCode)`.

**Escrituras (platform-admin):** cada una en `uow` + emite su evento por Outbox:
- `EnableCountryUseCase({ code, name, currencyCode, decimals })` → crea Country (o `CountryAlreadyExistsError`) → `tax.country.enabled`.
- `UpdateCountryUseCase({ code, name?, currencyCode?, decimals?, enabled? })` → `tax.country.updated`.
- `UpsertTaxRateUseCase({ countryCode, code, name, percentage, kind, isDefault? })` → valida país existe → `tax.tax_rate.upserted`.
- `UpsertIdentificationTypeUseCase({ countryCode, code, name, regex })` → `tax.identification_type.upserted`.
- `UpsertDocumentTypeUseCase({ countryCode, code, name })` → `tax.document_type.upserted`.

> Payloads de los eventos = fila completa (ver `asyncapi.yaml`), para que los consumidores hagan upsert de su read-model sin más consultas.

- [ ] Casos de uso implementados.

## Fase 6 — HTTP (`src/interface/http/`)

- **`middlewares.ts`**: `contextMiddleware` (lee `X-User-Id`, `X-Country-Code`, `X-Permissions`), `requireUser` (401 si falta `X-User-Id`), `requirePermission('tax:manage')` (403), `errorHandler`.
- **`validators.ts`**: Zod + `validateJson`. Schemas para enable/update country y upsert de cada catálogo.
- **`controllers.ts`**: factories. `country_code` viene del **path** (`/countries/:code`), no de `X-Organization-Id`.
- **`routes.ts` + `app.ts`**: monta rutas **exactamente** como `openapi.yaml`. Reads = `requireUser`. Writes = `requireUser` + `requirePermission('tax:manage')` + validador. CORS con `X-User-Id`/`X-Country-Code`/`X-Permissions`. `contextMiddleware` global. `onError`/`notFound`.

- [ ] Rutas montadas según `openapi.yaml`.

## Fase 7 — Composition root (`src/main.ts`)

`sequelize.authenticate()`, importa modelos, `buildRepositories()` + `SequelizeUnitOfWork`, instancia casos de uso, `createApp`, `serve` en `PORT` (3005). Config con Zod (sin JWT, sin `X-Organization-Id`).

- [ ] `npm run build` OK; `GET /health` responde.

## Fase 8 — Tests (`src/__tests__/`)

Vitest con repos fake. Cubrir: `EnableCountry` emite `tax.country.enabled`; `UpsertTaxRate` valida país y emite `tax.tax_rate.upserted`; upsert idempotente (2ª vez actualiza, no duplica); `GetCountry` inexistente → 404.

- [ ] `npm test` verde.

## Definición de "hecho"

1. `db:migrate` crea las 5 tablas y siembra EC (país + 3 tasas + 4 identificaciones + 5 comprobantes) con sus eventos en `outbox_messages`.
2. `GET /countries` devuelve EC; `GET /countries/EC/tax-rates` devuelve las 3 tasas.
3. `POST /countries` sin `tax:manage` → `403`; con el permiso, crea el país y escribe `tax.country.enabled` en Outbox.
4. Reads sin `X-User-Id` → `401`.
5. Upsert de catálogo emite su evento `tax.*.upserted` con la fila completa.
6. `npm test` + `npm run build` OK. `openapi.yaml` y `asyncapi.yaml` implementados fielmente.

## Fuera de alcance (no hacer)

- Relay de Outbox / consumers (infra compartida; los eventos quedan en la tabla).
- Aislamiento por `organization_id` (tax es plataforma, no tenant).
- Cálculo de impuestos / motor fiscal (eso es de billing). tax solo provee **catálogos**.
- Seeds de PE/CO/MX (se agregan luego vía la API de administración o nuevas migraciones de seed).
