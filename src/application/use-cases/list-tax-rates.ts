import { TaxRateRepository } from '../../domain/repositories';
import { TaxRateDTO } from '../dtos';

export class ListTaxRatesUseCase {
  constructor(private readonly taxRateRepo: TaxRateRepository) {}

  async execute(countryCode: string): Promise<TaxRateDTO[]> {
    const rates = await this.taxRateRepo.listByCountry(countryCode);
    return rates.map((r) => ({
      id: r.id,
      countryCode: r.countryCode,
      code: r.code,
      name: r.name,
      percentage: r.percentage,
      kind: r.kind,
      isDefault: r.isDefault,
    }));
  }
}
