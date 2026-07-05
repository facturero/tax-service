import { Context, MiddlewareHandler } from 'hono';
import {
  AppError,
  ForbiddenError,
  UserContextRequiredError,
} from '../../domain/errors';

export type ContextVariables = {
  userId: string;
  countryCode: string;
  permissions: string[];
};

export function contextMiddleware(): MiddlewareHandler<{
  Variables: ContextVariables;
}> {
  return async (c, next) => {
    const userId = c.req.header('X-User-Id');
    const countryCode = c.req.header('X-Country-Code');
    const perms = c.req.header('X-Permissions');

    if (userId) c.set('userId', userId);
    if (countryCode) c.set('countryCode', countryCode);
    if (perms) c.set('permissions', perms.split(',').map((p) => p.trim()));

    await next();
  };
}

export function requireUser(): MiddlewareHandler<{
  Variables: ContextVariables;
}> {
  return async (c, next) => {
    const userId = c.get('userId');
    if (!userId) throw new UserContextRequiredError();
    await next();
  };
}

export function requirePermission(perm: string): MiddlewareHandler<{
  Variables: ContextVariables;
}> {
  return async (c, next) => {
    const perms = c.get('permissions') ?? [];
    if (!perms.includes(perm)) throw new ForbiddenError();
    await next();
  };
}

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    return c.json(
      {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      err.httpStatus as 400,
    );
  }

  console.error('[tax-service] error no controlado:', err);
  return c.json({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }, 500);
}
