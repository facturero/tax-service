import { randomUUID } from 'node:crypto';
import { Transaction } from 'sequelize';
import { sequelize } from './sequelize';
import {
  CountryModel,
  TaxRateModel,
  IdentificationTypeModel,
  DocumentTypeModel,
  OutboxModel,
} from './models';
import {
  Country,
  TaxRate,
  IdentificationType,
  DocumentType,
} from '../../domain/entities';
import {
  CountryRepository,
  TaxRateRepository,
  IdentificationTypeRepository,
  DocumentTypeRepository,
  DomainEvent,
  OutboxRepository,
  Repositories,
} from '../../domain/repositories';
import { UnitOfWork } from '../../application/ports';
import { withActor } from '@facturero/outbox-relay';

function toCountry(m: CountryModel): Country {
  return Country.fromPersistence({
    code: m.code,
    name: m.name,
    currencyCode: m.currency_code,
    decimals: m.decimals,
    enabled: m.enabled,
  });
}

function toTaxRate(m: TaxRateModel): TaxRate {
  return TaxRate.fromPersistence({
    id: m.id,
    countryCode: m.country_code,
    code: m.code,
    name: m.name,
    percentage: Number(m.percentage),
    kind: m.kind,
    isDefault: m.is_default,
  });
}

function toIdentificationType(m: IdentificationTypeModel): IdentificationType {
  return IdentificationType.fromPersistence({
    id: m.id,
    countryCode: m.country_code,
    code: m.code,
    name: m.name,
    regex: m.regex,
  });
}

function toDocumentType(m: DocumentTypeModel): DocumentType {
  return DocumentType.fromPersistence({
    id: m.id,
    countryCode: m.country_code,
    code: m.code,
    name: m.name,
  });
}

function countryRepository(tx?: Transaction): CountryRepository {
  return {
    async findByCode(code) {
      const m = await CountryModel.findByPk(code, { transaction: tx });
      return m ? toCountry(m) : null;
    },
    async listEnabled() {
      const rows = await CountryModel.findAll({ where: { enabled: true }, transaction: tx });
      return rows.map(toCountry);
    },
    async listAll() {
      const rows = await CountryModel.findAll({ transaction: tx });
      return rows.map(toCountry);
    },
    async save(country) {
      const p = country.toPersistence();
      await CountryModel.upsert(
        {
          code: p.code,
          name: p.name,
          currency_code: p.currencyCode,
          decimals: p.decimals,
          enabled: p.enabled,
        },
        { transaction: tx },
      );
    },
  };
}

function taxRateRepository(tx?: Transaction): TaxRateRepository {
  return {
    async listByCountry(countryCode) {
      const rows = await TaxRateModel.findAll({ where: { country_code: countryCode }, transaction: tx });
      return rows.map(toTaxRate);
    },
    async findByCode(countryCode, code) {
      const m = await TaxRateModel.findOne({
        where: { country_code: countryCode, code },
        transaction: tx,
      });
      return m ? toTaxRate(m) : null;
    },
    async save(taxRate) {
      const p = taxRate.toPersistence();
      await TaxRateModel.upsert(
        {
          id: p.id,
          country_code: p.countryCode,
          code: p.code,
          name: p.name,
          percentage: p.percentage,
          kind: p.kind,
          is_default: p.isDefault,
        },
        { transaction: tx },
      );
    },
  };
}

function identificationTypeRepository(tx?: Transaction): IdentificationTypeRepository {
  return {
    async listByCountry(countryCode) {
      const rows = await IdentificationTypeModel.findAll({ where: { country_code: countryCode }, transaction: tx });
      return rows.map(toIdentificationType);
    },
    async findByCode(countryCode, code) {
      const m = await IdentificationTypeModel.findOne({
        where: { country_code: countryCode, code },
        transaction: tx,
      });
      return m ? toIdentificationType(m) : null;
    },
    async save(identType) {
      const p = identType.toPersistence();
      await IdentificationTypeModel.upsert(
        {
          id: p.id,
          country_code: p.countryCode,
          code: p.code,
          name: p.name,
          regex: p.regex,
        },
        { transaction: tx },
      );
    },
  };
}

function documentTypeRepository(tx?: Transaction): DocumentTypeRepository {
  return {
    async listByCountry(countryCode) {
      const rows = await DocumentTypeModel.findAll({ where: { country_code: countryCode }, transaction: tx });
      return rows.map(toDocumentType);
    },
    async findByCode(countryCode, code) {
      const m = await DocumentTypeModel.findOne({
        where: { country_code: countryCode, code },
        transaction: tx,
      });
      return m ? toDocumentType(m) : null;
    },
    async save(docType) {
      const p = docType.toPersistence();
      await DocumentTypeModel.upsert(
        {
          id: p.id,
          country_code: p.countryCode,
          code: p.code,
          name: p.name,
        },
        { transaction: tx },
      );
    },
  };
}

function outboxRepository(tx?: Transaction): OutboxRepository {
  return {
    async add(event: DomainEvent) {
      await OutboxModel.create(
        {
          id: randomUUID(),
          aggregate_type: event.aggregateType,
          aggregate_id: event.aggregateId,
          type: event.type,
          // Inyecta actor/ip/request-id desde el contexto de la petición.
          // Sin esto la bitácora de auditoría no sabe QUIÉN hizo cada cosa: el
          // `userId` que ya llevan algunos payloads es el usuario AFECTADO.
          payload: withActor(event.payload as Record<string, unknown>),
          occurred_at: event.occurredAt,
          processed_at: null,
        },
        { transaction: tx },
      );
    },
  };
}

export function buildRepositories(tx?: Transaction): Repositories {
  return {
    countries: countryRepository(tx),
    taxRates: taxRateRepository(tx),
    identificationTypes: identificationTypeRepository(tx),
    documentTypes: documentTypeRepository(tx),
    outbox: outboxRepository(tx),
  };
}

export class SequelizeUnitOfWork implements UnitOfWork {
  async execute<T>(work: (repos: Repositories) => Promise<T>): Promise<T> {
    return sequelize.transaction(async (tx) => work(buildRepositories(tx)));
  }
}
