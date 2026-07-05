import { randomUUID } from 'node:crypto';

export interface CountryProps {
  code: string;
  name: string;
  currencyCode: string;
  decimals: number;
  enabled: boolean;
}

export class Country {
  private constructor(private props: CountryProps) {}

  static create(params: {
    code: string;
    name: string;
    currencyCode: string;
    decimals?: number;
  }): Country {
    return new Country({
      code: params.code,
      name: params.name,
      currencyCode: params.currencyCode,
      decimals: params.decimals ?? 2,
      enabled: true,
    });
  }

  static fromPersistence(props: CountryProps): Country {
    return new Country({ ...props });
  }

  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get currencyCode(): string { return this.props.currencyCode; }
  get decimals(): number { return this.props.decimals; }
  get enabled(): boolean { return this.props.enabled; }

  update(params: { name?: string; currencyCode?: string; decimals?: number; enabled?: boolean }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.currencyCode !== undefined) this.props.currencyCode = params.currencyCode;
    if (params.decimals !== undefined) this.props.decimals = params.decimals;
    if (params.enabled !== undefined) this.props.enabled = params.enabled;
  }

  toPersistence(): CountryProps {
    return { ...this.props };
  }
}

export interface TaxRateProps {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  percentage: number;
  kind: 'vat' | 'withholding_iva' | 'withholding_rent' | 'special';
  isDefault: boolean;
}

export class TaxRate {
  private constructor(private props: TaxRateProps) {}

  static create(params: {
    countryCode: string;
    code: string;
    name: string;
    percentage: number;
    kind: 'vat' | 'withholding_iva' | 'withholding_rent' | 'special';
    isDefault?: boolean;
  }): TaxRate {
    return new TaxRate({
      id: randomUUID(),
      countryCode: params.countryCode,
      code: params.code,
      name: params.name,
      percentage: params.percentage,
      kind: params.kind,
      isDefault: params.isDefault ?? false,
    });
  }

  static fromPersistence(props: TaxRateProps): TaxRate {
    return new TaxRate({ ...props });
  }

  get id(): string { return this.props.id; }
  get countryCode(): string { return this.props.countryCode; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get percentage(): number { return this.props.percentage; }
  get kind(): string { return this.props.kind; }
  get isDefault(): boolean { return this.props.isDefault; }

  update(params: { name?: string; percentage?: number; kind?: TaxRateProps['kind']; isDefault?: boolean }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.percentage !== undefined) this.props.percentage = params.percentage;
    if (params.kind !== undefined) this.props.kind = params.kind;
    if (params.isDefault !== undefined) this.props.isDefault = params.isDefault;
  }

  toPersistence(): TaxRateProps {
    return { ...this.props };
  }
}

export interface IdentificationTypeProps {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  regex: string | null;
}

export class IdentificationType {
  private constructor(private props: IdentificationTypeProps) {}

  static create(params: {
    countryCode: string;
    code: string;
    name: string;
    regex?: string | null;
  }): IdentificationType {
    return new IdentificationType({
      id: randomUUID(),
      countryCode: params.countryCode,
      code: params.code,
      name: params.name,
      regex: params.regex ?? null,
    });
  }

  static fromPersistence(props: IdentificationTypeProps): IdentificationType {
    return new IdentificationType({ ...props });
  }

  get id(): string { return this.props.id; }
  get countryCode(): string { return this.props.countryCode; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get regex(): string | null { return this.props.regex; }

  update(params: { name?: string; regex?: string | null }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.regex !== undefined) this.props.regex = params.regex;
  }

  toPersistence(): IdentificationTypeProps {
    return { ...this.props };
  }
}

export interface DocumentTypeProps {
  id: string;
  countryCode: string;
  code: string;
  name: string;
}

export class DocumentType {
  private constructor(private props: DocumentTypeProps) {}

  static create(params: {
    countryCode: string;
    code: string;
    name: string;
  }): DocumentType {
    return new DocumentType({
      id: randomUUID(),
      countryCode: params.countryCode,
      code: params.code,
      name: params.name,
    });
  }

  static fromPersistence(props: DocumentTypeProps): DocumentType {
    return new DocumentType({ ...props });
  }

  get id(): string { return this.props.id; }
  get countryCode(): string { return this.props.countryCode; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }

  update(params: { name?: string }): void {
    if (params.name !== undefined) this.props.name = params.name;
  }

  toPersistence(): DocumentTypeProps {
    return { ...this.props };
  }
}
