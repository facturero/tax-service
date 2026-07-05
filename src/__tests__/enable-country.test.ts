import { describe, it, expect } from 'vitest';
import { createInMemoryUow } from './helpers';
import { EnableCountryUseCase } from '../application/use-cases/enable-country';
import { CountryAlreadyExistsError } from '../domain/errors';

describe('EnableCountryUseCase', () => {
  it('creates country and emits tax.country.enabled event', async () => {
    const uow = createInMemoryUow();
    const useCase = new EnableCountryUseCase(uow);

    const result = await useCase.execute({
      code: 'PE',
      name: 'Perú',
      currencyCode: 'PEN',
      decimals: 2,
    });

    expect(result.code).toBe('PE');
    expect(result.name).toBe('Perú');
    expect(result.enabled).toBe(true);

    const enabledEvent = uow.repos.events.find((e) => e.type === 'tax.country.enabled');
    expect(enabledEvent).toBeDefined();
    expect(enabledEvent!.payload).toMatchObject({
      countryCode: 'PE',
      name: 'Perú',
      currencyCode: 'PEN',
    });
  });

  it('rejects duplicate country', async () => {
    const uow = createInMemoryUow();
    const useCase = new EnableCountryUseCase(uow);

    await useCase.execute({
      code: 'PE',
      name: 'Perú',
      currencyCode: 'PEN',
    });

    await expect(
      useCase.execute({
        code: 'PE',
        name: 'Perú',
        currencyCode: 'PEN',
      }),
    ).rejects.toThrow(CountryAlreadyExistsError);
  });
});
