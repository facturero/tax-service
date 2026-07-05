import {
  DomainEvent,
  CountryRepository,
  TaxRateRepository,
  IdentificationTypeRepository,
  DocumentTypeRepository,
  OutboxRepository,
  Repositories,
} from '../domain/repositories';
import {
  Country,
  TaxRate,
  IdentificationType,
  DocumentType,
} from '../domain/entities';
import { UnitOfWork } from '../application/ports';

export function createInMemoryRepositories(): Repositories & { events: DomainEvent[] } {
  const countries = new Map<string, Country>();
  const taxRates = new Map<string, TaxRate>();
  const identTypes = new Map<string, IdentificationType>();
  const docTypes = new Map<string, DocumentType>();
  const events: DomainEvent[] = [];

  return {
    events,
    countries: {
      async findByCode(code) { return countries.get(code) ?? null; },
      async listEnabled() {
        return Array.from(countries.values()).filter((c) => c.enabled);
      },
      async listAll() {
        return Array.from(countries.values());
      },
      async save(country) {
        countries.set(country.code, Country.fromPersistence({ ...country.toPersistence() }));
      },
    } satisfies CountryRepository,
    taxRates: {
      async listByCountry(countryCode) {
        return Array.from(taxRates.values()).filter((r) => r.countryCode === countryCode);
      },
      async findByCode(countryCode, code) {
        return Array.from(taxRates.values()).find(
          (r) => r.countryCode === countryCode && r.code === code,
        ) ?? null;
      },
      async save(taxRate) {
        taxRates.set(taxRate.id, TaxRate.fromPersistence({ ...taxRate.toPersistence() }));
      },
    } satisfies TaxRateRepository,
    identificationTypes: {
      async listByCountry(countryCode) {
        return Array.from(identTypes.values()).filter((t) => t.countryCode === countryCode);
      },
      async findByCode(countryCode, code) {
        return Array.from(identTypes.values()).find(
          (t) => t.countryCode === countryCode && t.code === code,
        ) ?? null;
      },
      async save(identType) {
        identTypes.set(identType.id, IdentificationType.fromPersistence({ ...identType.toPersistence() }));
      },
    } satisfies IdentificationTypeRepository,
    documentTypes: {
      async listByCountry(countryCode) {
        return Array.from(docTypes.values()).filter((d) => d.countryCode === countryCode);
      },
      async findByCode(countryCode, code) {
        return Array.from(docTypes.values()).find(
          (d) => d.countryCode === countryCode && d.code === code,
        ) ?? null;
      },
      async save(docType) {
        docTypes.set(docType.id, DocumentType.fromPersistence({ ...docType.toPersistence() }));
      },
    } satisfies DocumentTypeRepository,
    outbox: {
      async add(event) {
        events.push({ ...event });
      },
    } satisfies OutboxRepository,
  };
}

export function createInMemoryUow(): UnitOfWork & { repos: Repositories & { events: DomainEvent[] } } {
  const repos = createInMemoryRepositories();
  return {
    repos,
    execute<T>(work: (r: Repositories) => Promise<T>): Promise<T> {
      return work(repos);
    },
  };
}
