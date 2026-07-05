import { CountryRepository } from '../../domain/repositories';
import { CountryDTO } from '../dtos';

export class ListCountriesUseCase {
  constructor(private readonly countryRepo: CountryRepository) {}

  async execute(): Promise<CountryDTO[]> {
    const countries = await this.countryRepo.listEnabled();
    return countries.map((c) => ({
      code: c.code,
      name: c.name,
      currencyCode: c.currencyCode,
      decimals: c.decimals,
      enabled: c.enabled,
    }));
  }
}
