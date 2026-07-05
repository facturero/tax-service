export interface ErrorDetail {
  field: string;
  message: string;
}

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details?: ErrorDetail[];

  constructor(message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(details: ErrorDetail[], message = 'La petición no es válida.') {
    super(message, details);
  }
}

export class UserContextRequiredError extends AppError {
  readonly code = 'USER_CONTEXT_REQUIRED';
  readonly httpStatus = 401;
  constructor(message = 'Falta el contexto de usuario.') { super(message); }
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
  constructor(message = 'Permiso insuficiente.') { super(message); }
}

export class CountryNotFoundError extends AppError {
  readonly code = 'COUNTRY_NOT_FOUND';
  readonly httpStatus = 404;
  constructor(message = 'País no encontrado.') { super(message); }
}

export class CountryAlreadyExistsError extends AppError {
  readonly code = 'COUNTRY_EXISTS';
  readonly httpStatus = 409;
  constructor(message = 'El país ya está habilitado.') { super(message); }
}

export class InvalidCountryCodeError extends AppError {
  readonly code = 'INVALID_COUNTRY_CODE';
  readonly httpStatus = 422;
  constructor(message = 'Código de país inválido.') { super(message); }
}

export class CatalogItemNotFoundError extends AppError {
  readonly code = 'CATALOG_ITEM_NOT_FOUND';
  readonly httpStatus = 404;
  constructor(message = 'Elemento del catálogo no encontrado.') { super(message); }
}
