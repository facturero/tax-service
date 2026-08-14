import './infrastructure/telemetry/otel';
import { serve } from '@hono/node-server';
import { config } from './infrastructure/config';
import { sequelize } from './infrastructure/persistence/sequelize';
import './infrastructure/persistence/models';
import { buildRepositories, SequelizeUnitOfWork } from './infrastructure/persistence/repositories';
import { ListCountriesUseCase } from './application/use-cases/list-countries';
import { GetCountryUseCase } from './application/use-cases/get-country';
import { EnableCountryUseCase } from './application/use-cases/enable-country';
import { UpdateCountryUseCase } from './application/use-cases/update-country';
import { ListTaxRatesUseCase } from './application/use-cases/list-tax-rates';
import { UpsertTaxRateUseCase } from './application/use-cases/upsert-tax-rate';
import { ListIdentificationTypesUseCase } from './application/use-cases/list-identification-types';
import { UpsertIdentificationTypeUseCase } from './application/use-cases/upsert-identification-type';
import { ListDocumentTypesUseCase } from './application/use-cases/list-document-types';
import { UpsertDocumentTypeUseCase } from './application/use-cases/upsert-document-type';
import { createApp } from './interface/http/app';

async function main(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();

  const repos = buildRepositories();
  const uow = new SequelizeUnitOfWork();

  const app = createApp({
    useCases: {
      listCountries: new ListCountriesUseCase(repos.countries),
      getCountry: new GetCountryUseCase(repos.countries),
      enableCountry: new EnableCountryUseCase(uow),
      updateCountry: new UpdateCountryUseCase(uow),
      listTaxRates: new ListTaxRatesUseCase(repos.taxRates),
      upsertTaxRate: new UpsertTaxRateUseCase(uow),
      listIdentificationTypes: new ListIdentificationTypesUseCase(repos.identificationTypes),
      upsertIdentificationType: new UpsertIdentificationTypeUseCase(uow),
      listDocumentTypes: new ListDocumentTypesUseCase(repos.documentTypes),
      upsertDocumentType: new UpsertDocumentTypeUseCase(uow),
    },
    corsOrigin: config.CORS_ORIGIN,
  });

  serve({ fetch: app.fetch, port: config.PORT }, (info) => {
    console.log(`tax-service escuchando en http://localhost:${info.port}`);
  });
}

main().catch((e) => {
  console.error('Fallo al iniciar tax-service:', e);
  process.exit(1);
});
