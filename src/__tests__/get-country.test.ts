import { describe, it, expect } from 'vitest';
import { createInMemoryUow } from './helpers';
import { EnableCountryUseCase } from '../application/use-cases/enable-country';
import { GetCountryUseCase } from '../application/use-cases/get-country';
import { CountryNotFoundError } from '../domain/errors';

describe('GetCountryUseCase', () => {
  it('returns country when found', async () => {
    const uow = createInMemoryUow();
    const enableCountry = new EnableCountryUseCase(uow);
    const useCase = new GetCountryUseCase(uow.repos.countries);

    await enableCountry.execute({ code: 'EC', name: 'Ecuador', currencyCode: 'USD' });

    const result = await useCase.execute('EC');
    expect(result.code).toBe('EC');
    expect(result.name).toBe('Ecuador');
  });

  it('throws CountryNotFoundError for non-existent country', async () => {
    const uow = createInMemoryUow();
    const useCase = new GetCountryUseCase(uow.repos.countries);

    await expect(useCase.execute('XX')).rejects.toThrow(CountryNotFoundError);
  });
});
