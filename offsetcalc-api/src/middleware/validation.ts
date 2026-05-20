import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendError } from '../utils/response';

export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
      return;
    }
    req[property] = value;
    next();
  };
}
