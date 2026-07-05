import {
  Country,
  TaxRate,
  IdentificationType,
  DocumentType,
} from './entities';

export interface DomainEvent {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface CountryRepository {
  findByCode(code: string): Promise<Country | null>;
  listEnabled(): Promise<Country[]>;
  listAll(): Promise<Country[]>;
  save(country: Country): Promise<void>;
}

export interface TaxRateRepository {
  listByCountry(countryCode: string): Promise<TaxRate[]>;
  findByCode(countryCode: string, code: string): Promise<TaxRate | null>;
  save(taxRate: TaxRate): Promise<void>;
}

export interface IdentificationTypeRepository {
  listByCountry(countryCode: string): Promise<IdentificationType[]>;
  findByCode(countryCode: string, code: string): Promise<IdentificationType | null>;
  save(identType: IdentificationType): Promise<void>;
}

export interface DocumentTypeRepository {
  listByCountry(countryCode: string): Promise<DocumentType[]>;
  findByCode(countryCode: string, code: string): Promise<DocumentType | null>;
  save(docType: DocumentType): Promise<void>;
}

export interface OutboxRepository {
  add(event: DomainEvent): Promise<void>;
}

export interface Repositories {
  countries: CountryRepository;
  taxRates: TaxRateRepository;
  identificationTypes: IdentificationTypeRepository;
  documentTypes: DocumentTypeRepository;
  outbox: OutboxRepository;
}
