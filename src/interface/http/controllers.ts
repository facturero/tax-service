import { Context } from 'hono';
import { ListCountriesUseCase } from '../../application/use-cases/list-countries';
import { GetCountryUseCase } from '../../application/use-cases/get-country';
import { ListTaxRatesUseCase } from '../../application/use-cases/list-tax-rates';
import { ListIdentificationTypesUseCase } from '../../application/use-cases/list-identification-types';
import { ListDocumentTypesUseCase } from '../../application/use-cases/list-document-types';
import { EnableCountryUseCase } from '../../application/use-cases/enable-country';
import { UpdateCountryUseCase } from '../../application/use-cases/update-country';
import { UpsertTaxRateUseCase } from '../../application/use-cases/upsert-tax-rate';
import { UpsertIdentificationTypeUseCase } from '../../application/use-cases/upsert-identification-type';
import { UpsertDocumentTypeUseCase } from '../../application/use-cases/upsert-document-type';
import { ContextVariables } from './middlewares';

export function listCountriesController(useCase: ListCountriesUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const result = await useCase.execute();
    return c.json(result, 200);
  };
}

export function getCountryController(useCase: GetCountryUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const result = await useCase.execute(code);
    return c.json(result, 200);
  };
}

export function enableCountryController(useCase: EnableCountryUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const body = c.req.valid('json' as never) as {
      code: string;
      name: string;
      currencyCode: string;
      decimals?: number;
    };
    const result = await useCase.execute(body);
    return c.json(result, 201);
  };
}

export function updateCountryController(useCase: UpdateCountryUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const body = c.req.valid('json' as never) as {
      name?: string;
      currencyCode?: string;
      decimals?: number;
      enabled?: boolean;
    };
    const result = await useCase.execute({ code, ...body });
    return c.json(result, 200);
  };
}

export function listTaxRatesController(useCase: ListTaxRatesUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const result = await useCase.execute(code);
    return c.json(result, 200);
  };
}

export function upsertTaxRateController(useCase: UpsertTaxRateUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const body = c.req.valid('json' as never) as {
      code: string;
      name: string;
      percentage: number;
      kind: 'vat' | 'withholding_iva' | 'withholding_rent' | 'special';
      isDefault?: boolean;
    };
    const result = await useCase.execute({ countryCode: code, ...body });
    return c.json(result, 200);
  };
}

export function listIdentificationTypesController(useCase: ListIdentificationTypesUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const result = await useCase.execute(code);
    return c.json(result, 200);
  };
}

export function upsertIdentificationTypeController(useCase: UpsertIdentificationTypeUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const body = c.req.valid('json' as never) as {
      code: string;
      name: string;
      regex?: string;
    };
    const result = await useCase.execute({ countryCode: code, ...body });
    return c.json(result, 200);
  };
}

export function listDocumentTypesController(useCase: ListDocumentTypesUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const result = await useCase.execute(code);
    return c.json(result, 200);
  };
}

export function upsertDocumentTypeController(useCase: UpsertDocumentTypeUseCase) {
  return async (c: Context<{ Variables: ContextVariables }>) => {
    const code = c.req.param('code') ?? '';
    const body = c.req.valid('json' as never) as {
      code: string;
      name: string;
    };
    const result = await useCase.execute({ countryCode: code, ...body });
    return c.json(result, 200);
  };
}
