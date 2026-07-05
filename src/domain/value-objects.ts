import { InvalidCountryCodeError } from './errors';

const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

export class CountryCode {
  private constructor(public readonly value: string) {}

  static create(raw: string): CountryCode {
    const code = raw.trim().toUpperCase();
    if (!COUNTRY_CODE_RE.test(code)) {
      throw new InvalidCountryCodeError('El código de país debe ser ISO alpha-2 (2 letras mayúsculas).');
    }
    return new CountryCode(code);
  }

  equals(other: CountryCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
