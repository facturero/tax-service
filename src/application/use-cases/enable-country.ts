import { CountryAlreadyExistsError } from '../../domain/errors';
import { Country } from '../../domain/entities';
import { CountryCode } from '../../domain/value-objects';
import { UnitOfWork } from '../ports';
import { CountryDTO, EnableCountryInput } from '../dtos';

export class EnableCountryUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: EnableCountryInput): Promise<CountryDTO> {
    const countryCode = CountryCode.create(input.code);

    return this.uow.execute(async (repos) => {
      const existing = await repos.countries.findByCode(countryCode.value);
      if (existing) throw new CountryAlreadyExistsError();

      const country = Country.create({
        code: countryCode.value,
        name: input.name,
        currencyCode: input.currencyCode,
        decimals: input.decimals,
      });
      await repos.countries.save(country);

      await repos.outbox.add({
        type: 'tax.country.enabled',
        aggregateType: 'country',
        aggregateId: countryCode.value,
        payload: {
          countryCode: country.code,
          name: country.name,
          currencyCode: country.currencyCode,
          decimals: country.decimals,
        },
        occurredAt: new Date(),
      });

      return {
        code: country.code,
        name: country.name,
        currencyCode: country.currencyCode,
        decimals: country.decimals,
        enabled: country.enabled,
      };
    });
  }
}
