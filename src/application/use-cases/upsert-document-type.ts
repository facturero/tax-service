import { CountryNotFoundError } from '../../domain/errors';
import { DocumentType } from '../../domain/entities';
import { UnitOfWork } from '../ports';
import { DocumentTypeDTO, UpsertDocumentTypeInput } from '../dtos';

export class UpsertDocumentTypeUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: UpsertDocumentTypeInput): Promise<DocumentTypeDTO> {
    return this.uow.execute(async (repos) => {
      const country = await repos.countries.findByCode(input.countryCode);
      if (!country) throw new CountryNotFoundError();

      const existing = await repos.documentTypes.findByCode(input.countryCode, input.code);
      if (existing) {
        existing.update({ name: input.name });
        await repos.documentTypes.save(existing);

        await repos.outbox.add({
          type: 'tax.document_type.upserted',
          aggregateType: 'document_type',
          aggregateId: existing.id,
          payload: {
            id: existing.id,
            countryCode: existing.countryCode,
            code: existing.code,
            name: existing.name,
          },
          occurredAt: new Date(),
        });

        return {
          id: existing.id,
          countryCode: existing.countryCode,
          code: existing.code,
          name: existing.name,
        };
      }

      const docType = DocumentType.create({
        countryCode: input.countryCode,
        code: input.code,
        name: input.name,
      });
      await repos.documentTypes.save(docType);

      await repos.outbox.add({
        type: 'tax.document_type.upserted',
        aggregateType: 'document_type',
        aggregateId: docType.id,
        payload: {
          id: docType.id,
          countryCode: docType.countryCode,
          code: docType.code,
          name: docType.name,
        },
        occurredAt: new Date(),
      });

      return {
        id: docType.id,
        countryCode: docType.countryCode,
        code: docType.code,
        name: docType.name,
      };
    });
  }
}
