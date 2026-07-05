import { CountryNotFoundError } from '../../domain/errors';
import { IdentificationType } from '../../domain/entities';
import { UnitOfWork } from '../ports';
import { IdentificationTypeDTO, UpsertIdentificationTypeInput } from '../dtos';

export class UpsertIdentificationTypeUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: UpsertIdentificationTypeInput): Promise<IdentificationTypeDTO> {
    return this.uow.execute(async (repos) => {
      const country = await repos.countries.findByCode(input.countryCode);
      if (!country) throw new CountryNotFoundError();

      const existing = await repos.identificationTypes.findByCode(input.countryCode, input.code);
      if (existing) {
        existing.update({ name: input.name, regex: input.regex });
        await repos.identificationTypes.save(existing);

        await repos.outbox.add({
          type: 'tax.identification_type.upserted',
          aggregateType: 'identification_type',
          aggregateId: existing.id,
          payload: {
            id: existing.id,
            countryCode: existing.countryCode,
            code: existing.code,
            name: existing.name,
            regex: existing.regex,
          },
          occurredAt: new Date(),
        });

        return {
          id: existing.id,
          countryCode: existing.countryCode,
          code: existing.code,
          name: existing.name,
          regex: existing.regex,
        };
      }

      const identType = IdentificationType.create({
        countryCode: input.countryCode,
        code: input.code,
        name: input.name,
        regex: input.regex,
      });
      await repos.identificationTypes.save(identType);

      await repos.outbox.add({
        type: 'tax.identification_type.upserted',
        aggregateType: 'identification_type',
        aggregateId: identType.id,
        payload: {
          id: identType.id,
          countryCode: identType.countryCode,
          code: identType.code,
          name: identType.name,
          regex: identType.regex,
        },
        occurredAt: new Date(),
      });

      return {
        id: identType.id,
        countryCode: identType.countryCode,
        code: identType.code,
        name: identType.name,
        regex: identType.regex,
      };
    });
  }
}
