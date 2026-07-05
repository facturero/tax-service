import { CountryNotFoundError } from '../../domain/errors';
import { CountryRepository } from '../../domain/repositories';
import { CountryCode } from '../../domain/value-objects';
import { CountryDTO } from '../dtos';

export class GetCountryUseCase {
  constructor(private readonly countryRepo: CountryRepository) {}

  async execute(code: string): Promise<CountryDTO> {
    const countryCode = CountryCode.create(code);
    const country = await this.countryRepo.findByCode(countryCode.value);
    if (!country) throw new CountryNotFoundError();
    return {
      code: country.code,
      name: country.name,
      currencyCode: country.currencyCode,
      decimals: country.decimals,
      enabled: country.enabled,
    };
  }
}
