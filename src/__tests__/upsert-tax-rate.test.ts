import { describe, it, expect } from 'vitest';
import { createInMemoryUow } from './helpers';
import { EnableCountryUseCase } from '../application/use-cases/enable-country';
import { UpsertTaxRateUseCase } from '../application/use-cases/upsert-tax-rate';
import { CountryNotFoundError } from '../domain/errors';

describe('UpsertTaxRateUseCase', () => {
  it('creates tax rate and emits event', async () => {
    const uow = createInMemoryUow();
    const enableCountry = new EnableCountryUseCase(uow);
    const useCase = new UpsertTaxRateUseCase(uow);

    await enableCountry.execute({ code: 'EC', name: 'Ecuador', currencyCode: 'USD' });

    const result = await useCase.execute({
      countryCode: 'EC',
      code: 'IVA15',
      name: 'IVA 15%',
      percentage: 15,
      kind: 'vat',
      isDefault: true,
    });

    expect(result.code).toBe('IVA15');
    expect(result.percentage).toBe(15);

    const event = uow.repos.events.find((e) => e.type === 'tax.tax_rate.upserted');
    expect(event).toBeDefined();
    expect(event!.payload).toMatchObject({
      countryCode: 'EC',
      code: 'IVA15',
      percentage: 15,
    });
  });

  it('rejects when country does not exist', async () => {
    const uow = createInMemoryUow();
    const useCase = new UpsertTaxRateUseCase(uow);

    await expect(
      useCase.execute({
        countryCode: 'XX',
        code: 'IVA15',
        name: 'IVA 15%',
        percentage: 15,
        kind: 'vat',
      }),
    ).rejects.toThrow(CountryNotFoundError);
  });

  it('updates existing tax rate idempotently', async () => {
    const uow = createInMemoryUow();
    const enableCountry = new EnableCountryUseCase(uow);
    const useCase = new UpsertTaxRateUseCase(uow);

    await enableCountry.execute({ code: 'EC', name: 'Ecuador', currencyCode: 'USD' });

    await useCase.execute({
      countryCode: 'EC',
      code: 'IVA15',
      name: 'IVA 15%',
      percentage: 15,
      kind: 'vat',
      isDefault: true,
    });

    const eventsBefore = uow.repos.events.length;

    const result = await useCase.execute({
      countryCode: 'EC',
      code: 'IVA15',
      name: 'IVA 15% - actualizado',
      percentage: 15,
      kind: 'vat',
      isDefault: true,
    });

    expect(result.name).toBe('IVA 15% - actualizado');
    expect(uow.repos.events.length).toBe(eventsBefore + 1);
  });

  it('returns 404 via CountryNotFoundError for non-existent country', async () => {
    const uow = createInMemoryUow();
    const useCase = new UpsertTaxRateUseCase(uow);

    try {
      await useCase.execute({
        countryCode: 'XX',
        code: 'IVA15',
        name: 'IVA 15%',
        percentage: 15,
        kind: 'vat',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(CountryNotFoundError);
      expect((e as CountryNotFoundError).httpStatus).toBe(404);
    }
  });
});
