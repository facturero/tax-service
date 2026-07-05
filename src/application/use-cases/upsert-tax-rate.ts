import { CountryNotFoundError } from '../../domain/errors';
import { TaxRate } from '../../domain/entities';
import { UnitOfWork } from '../ports';
import { TaxRateDTO, UpsertTaxRateInput } from '../dtos';

export class UpsertTaxRateUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: UpsertTaxRateInput): Promise<TaxRateDTO> {
    return this.uow.execute(async (repos) => {
      const country = await repos.countries.findByCode(input.countryCode);
      if (!country) throw new CountryNotFoundError();

      const existing = await repos.taxRates.findByCode(input.countryCode, input.code);
      if (existing) {
        existing.update({
          name: input.name,
          percentage: input.percentage,
          kind: input.kind,
          isDefault: input.isDefault,
        });
        await repos.taxRates.save(existing);

        await repos.outbox.add({
          type: 'tax.tax_rate.upserted',
          aggregateType: 'tax_rate',
          aggregateId: existing.id,
          payload: {
            id: existing.id,
            countryCode: existing.countryCode,
            code: existing.code,
            name: existing.name,
            percentage: existing.percentage,
            kind: existing.kind,
            isDefault: existing.isDefault,
          },
          occurredAt: new Date(),
        });

        return {
          id: existing.id,
          countryCode: existing.countryCode,
          code: existing.code,
          name: existing.name,
          percentage: existing.percentage,
          kind: existing.kind,
          isDefault: existing.isDefault,
        };
      }

      const taxRate = TaxRate.create({
        countryCode: input.countryCode,
        code: input.code,
        name: input.name,
        percentage: input.percentage,
        kind: input.kind,
        isDefault: input.isDefault,
      });
      await repos.taxRates.save(taxRate);

      await repos.outbox.add({
        type: 'tax.tax_rate.upserted',
        aggregateType: 'tax_rate',
        aggregateId: taxRate.id,
        payload: {
          id: taxRate.id,
          countryCode: taxRate.countryCode,
          code: taxRate.code,
          name: taxRate.name,
          percentage: taxRate.percentage,
          kind: taxRate.kind,
          isDefault: taxRate.isDefault,
        },
        occurredAt: new Date(),
      });

      return {
        id: taxRate.id,
        countryCode: taxRate.countryCode,
        code: taxRate.code,
        name: taxRate.name,
        percentage: taxRate.percentage,
        kind: taxRate.kind,
        isDefault: taxRate.isDefault,
      };
    });
  }
}
