import { DocumentTypeRepository } from '../../domain/repositories';
import { DocumentTypeDTO } from '../dtos';

export class ListDocumentTypesUseCase {
  constructor(private readonly docTypeRepo: DocumentTypeRepository) {}

  async execute(countryCode: string): Promise<DocumentTypeDTO[]> {
    const types = await this.docTypeRepo.listByCountry(countryCode);
    return types.map((t) => ({
      id: t.id,
      countryCode: t.countryCode,
      code: t.code,
      name: t.name,
    }));
  }
}
