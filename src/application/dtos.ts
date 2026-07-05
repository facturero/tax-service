export interface CountryDTO {
  code: string;
  name: string;
  currencyCode: string;
  decimals: number;
  enabled: boolean;
}

export interface TaxRateDTO {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  percentage: number;
  kind: string;
  isDefault: boolean;
}

export interface IdentificationTypeDTO {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  regex: string | null;
}

export interface DocumentTypeDTO {
  id: string;
  countryCode: string;
  code: string;
  name: string;
}

export interface EnableCountryInput {
  code: string;
  name: string;
  currencyCode: string;
  decimals?: number;
}

export interface UpdateCountryInput {
  code: string;
  name?: string;
  currencyCode?: string;
  decimals?: number;
  enabled?: boolean;
}

export interface UpsertTaxRateInput {
  countryCode: string;
  code: string;
  name: string;
  percentage: number;
  kind: 'vat' | 'withholding_iva' | 'withholding_rent' | 'special';
  isDefault?: boolean;
}

export interface UpsertIdentificationTypeInput {
  countryCode: string;
  code: string;
  name: string;
  regex?: string | null;
}

export interface UpsertDocumentTypeInput {
  countryCode: string;
  code: string;
  name: string;
}
