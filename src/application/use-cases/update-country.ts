import { CountryNotFoundError } from '../../domain/errors';
import { CountryCode } from '../../domain/value-objects';
import { UnitOfWork } from '../ports';
import { CountryDTO, UpdateCountryInput } from '../dtos';

export class UpdateCountryUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: UpdateCountryInput): Promise<CountryDTO> {
    const countryCode = CountryCode.create(input.code);

    return this.uow.execute(async (repos) => {
      const country = await repos.countries.findByCode(countryCode.value);
      if (!country) throw new CountryNotFoundError();

      country.update({
        name: input.name,
        currencyCode: input.currencyCode,
        decimals: input.decimals,
        enabled: input.enabled,
      });
      await repos.countries.save(country);

      await repos.outbox.add({
        type: 'tax.country.updated',
        aggregateType: 'country',
        aggregateId: countryCode.value,
        payload: {
          countryCode: country.code,
          name: country.name,
          currencyCode: country.currencyCode,
          decimals: country.decimals,
          enabled: country.enabled,
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
