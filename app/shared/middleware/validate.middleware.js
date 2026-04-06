import * as yup from 'yup';
import { HttpError } from '../utils/http-error.js';

function isYupSchema(candidate) {
  return candidate && typeof candidate.validate === 'function' && candidate.type != null;
}

function yupIssuesFromError(err) {
  const inner = err.inner?.length ? err.inner : [err];
  return inner.map((e) => ({
    field: e.path?.replace(/^\[|\]$/g, '') || e.path || '(root)',
    message: e.message ?? 'Invalid value',
  }));
}

export const validateBody = (schemaOrDto) => {
  if (isYupSchema(schemaOrDto)) {
    return async (req, res, next) => {
      try {
        req.body = await schemaOrDto.validate(req.body ?? {}, {
          abortEarly: false,
          stripUnknown: true,
        });
        return next();
      } catch (err) {
        if (err?.name === 'ValidationError') {
          return next(
            new HttpError(400, 'VALIDATION_ERROR', 'Request body validation failed', {
              issues: yupIssuesFromError(err),
            }),
          );
        }
        return next(err);
      }
    };
  }

  const DtoClass = schemaOrDto;
  return async (req, res, next) => {
    try {
      const instance = DtoClass.transform ? DtoClass.transform(req.body) : new DtoClass();
      const errors = DtoClass.validate ? DtoClass.validate(instance) : [];
      if (errors.length > 0) {
        return next(
          new HttpError(400, 'VALIDATION_ERROR', 'Request body validation failed', {
            issues: errors,
          }),
        );
      }
      req.body = instance;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

const validateWithSource = (schema, source) => {
  if (!isYupSchema(schema)) {
    throw new Error(`validate${source}: expected a Yup schema`);
  }
  return async (req, res, next) => {
    try {
      const raw = req[source] ?? (source === 'body' ? {} : {});
      req[source] = await schema.validate(raw, {
        abortEarly: false,
        stripUnknown: true,
      });
      return next();
    } catch (err) {
      if (err?.name === 'ValidationError') {
        return next(
          new HttpError(400, 'VALIDATION_ERROR', `${source} validation failed`, {
            issues: yupIssuesFromError(err),
          }),
        );
      }
      return next(err);
    }
  };
};

export const validateQuery = (schema) => validateWithSource(schema, 'query');
export const validateParams = (schema) => validateWithSource(schema, 'params');

export { yup };
