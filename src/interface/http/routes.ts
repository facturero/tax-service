import { Hono } from 'hono';
import { ListCountriesUseCase } from '../../application/use-cases/list-countries';
import { GetCountryUseCase } from '../../application/use-cases/get-country';
import { ListTaxRatesUseCase } from '../../application/use-cases/list-tax-rates';
import { ListIdentificationTypesUseCase } from '../../application/use-cases/list-identification-types';
import { ListDocumentTypesUseCase } from '../../application/use-cases/list-document-types';
import { EnableCountryUseCase } from '../../application/use-cases/enable-country';
import { UpdateCountryUseCase } from '../../application/use-cases/update-country';
import { UpsertTaxRateUseCase } from '../../application/use-cases/upsert-tax-rate';
import { UpsertIdentificationTypeUseCase } from '../../application/use-cases/upsert-identification-type';
import { UpsertDocumentTypeUseCase } from '../../application/use-cases/upsert-document-type';
import {
  enableCountrySchema,
  updateCountrySchema,
  upsertTaxRateSchema,
  upsertIdentificationTypeSchema,
  upsertDocumentTypeSchema,
  validateJson,
} from './validators';
import {
  listCountriesController,
  getCountryController,
  enableCountryController,
  updateCountryController,
  listTaxRatesController,
  upsertTaxRateController,
  listIdentificationTypesController,
  upsertIdentificationTypeController,
  listDocumentTypesController,
  upsertDocumentTypeController,
} from './controllers';
import { ContextVariables, requirePermission, requireUser } from './middlewares';

type Vars = { Variables: ContextVariables };

export interface AppDependencies {
  useCases: {
    listCountries: ListCountriesUseCase;
    getCountry: GetCountryUseCase;
    enableCountry: EnableCountryUseCase;
    updateCountry: UpdateCountryUseCase;
    listTaxRates: ListTaxRatesUseCase;
    upsertTaxRate: UpsertTaxRateUseCase;
    listIdentificationTypes: ListIdentificationTypesUseCase;
    upsertIdentificationType: UpsertIdentificationTypeUseCase;
    listDocumentTypes: ListDocumentTypesUseCase;
    upsertDocumentType: UpsertDocumentTypeUseCase;
  };
  corsOrigin: string;
}

export function healthRoutes(): Hono {
  const r = new Hono();
  r.get('/health', (c) => c.json({ status: 'ok' }));
  return r;
}

export function countryRoutes(deps: AppDependencies): Hono<Vars> {
  const r = new Hono<Vars>();
  const { useCases } = deps;

  r.get('/countries',
    requireUser(),
    listCountriesController(useCases.listCountries));

  r.post('/countries',
    requireUser(),
    requirePermission('tax:manage'),
    validateJson(enableCountrySchema),
    enableCountryController(useCases.enableCountry));

  r.get('/countries/:code',
    requireUser(),
    getCountryController(useCases.getCountry));

  r.patch('/countries/:code',
    requireUser(),
    requirePermission('tax:manage'),
    validateJson(updateCountrySchema),
    updateCountryController(useCases.updateCountry));

  r.get('/countries/:code/tax-rates',
    requireUser(),
    listTaxRatesController(useCases.listTaxRates));

  r.post('/countries/:code/tax-rates',
    requireUser(),
    requirePermission('tax:manage'),
    validateJson(upsertTaxRateSchema),
    upsertTaxRateController(useCases.upsertTaxRate));

  r.get('/countries/:code/identification-types',
    requireUser(),
    listIdentificationTypesController(useCases.listIdentificationTypes));

  r.post('/countries/:code/identification-types',
    requireUser(),
    requirePermission('tax:manage'),
    validateJson(upsertIdentificationTypeSchema),
    upsertIdentificationTypeController(useCases.upsertIdentificationType));

  r.get('/countries/:code/document-types',
    requireUser(),
    listDocumentTypesController(useCases.listDocumentTypes));

  r.post('/countries/:code/document-types',
    requireUser(),
    requirePermission('tax:manage'),
    validateJson(upsertDocumentTypeSchema),
    upsertDocumentTypeController(useCases.upsertDocumentType));

  return r;
}
