import { IdentificationTypeRepository } from '../../domain/repositories';
import { IdentificationTypeDTO } from '../dtos';

export class ListIdentificationTypesUseCase {
  constructor(private readonly identTypeRepo: IdentificationTypeRepository) {}

  async execute(countryCode: string): Promise<IdentificationTypeDTO[]> {
    const types = await this.identTypeRepo.listByCountry(countryCode);
    return types.map((t) => ({
      id: t.id,
      countryCode: t.countryCode,
      code: t.code,
      name: t.name,
      regex: t.regex,
    }));
  }
}
