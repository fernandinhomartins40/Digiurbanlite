/**
 * Middleware de Validação com Joi
 * Sistema profissional de validação de requests usando tipos centralizados
 */

import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';
import { Schema, ValidationError } from 'joi';
import {
  ValidationConfig,
  ValidationErrorDetail,
  ValidationErrorResponse,
  MiddlewareFunction
        } from '../types';

// Interface para detalhes do erro Joi
interface JoiErrorDetail {
  message: string;
  path?: (string | number)[];
  context?: {
    value?: unknown;
    [key: string]: unknown;
  };
}

// Interface para erro Joi com propriedade isJoi
interface JoiValidationError extends Error {
  isJoi: boolean;
  details: JoiErrorDetail[];
}

/**
 * Middleware genérico de validação usando tipos centralizados
 */
export const validateRequest = (schema: Schema, config?: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const validationOptions = {
      abortEarly: config?.abortEarly ?? false,
      allowUnknown: config?.allowUnknown ?? false,
      stripUnknown: config?.stripUnknown ?? true,
      context: config?.context
        };

    const { error } = schema.validate(req.body, validationOptions);

    if (error) {
      const response: ValidationErrorResponse = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos fornecidos',
        details: error.details.map(
          detail =>
            ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
        }) as ValidationErrorDetail
        )
        };

      return res.status(400).json(response);
    }

    next();
  };
};

/**
 * Validação de parâmetros de query usando tipos centralizados
 */
export const validateQuery = (schema: Schema, config?: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const validationOptions = {
      abortEarly: config?.abortEarly ?? false,
      allowUnknown: config?.allowUnknown ?? true,
      stripUnknown: config?.stripUnknown ?? true,
      context: config?.context
        };

    const { error } = schema.validate(req.query, validationOptions);

    if (error) {
      const response: ValidationErrorResponse = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Parâmetros de consulta inválidos',
        details: error.details.map(
          detail =>
            ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
        }) as ValidationErrorDetail
        )
        };

      return res.status(400).json(response);
    }

    next();
  };
};

/**
 * Validação de parâmetros de rota usando tipos centralizados
 */
export const validateParams = (schema: Schema, config?: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const { error } = schema.validate(req.params);

    if (error) {
      const response: ValidationErrorResponse = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Parâmetros de rota inválidos',
        details: error.details.map(
          detail =>
            ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
        }) as ValidationErrorDetail
        )
        };

      return res.status(400).json(response);
    }

    next();
  };
};

// Schemas comuns reutilizáveis
export const commonSchemas = {
  // IDs
  id: Joi.string().required().messages({
    'string.empty': 'ID é obrigatório',
    'any.required': 'ID é obrigatório'
        }),

  // Paginação
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0)
        }),

  // Datas
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
        }),

  // Email
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter formato válido',
    'any.required': 'Email é obrigatório'
        }),

  // CPF (formato brasileiro)
  cpf: Joi.string()
    .pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
    .messages({
      'string.pattern.base': 'CPF deve ter formato válido (000.000.000-00 ou 00000000000)'
        }),

  // CNPJ (formato brasileiro)
  cnpj: Joi.string()
    .pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/)
    .messages({
      'string.pattern.base': 'CNPJ deve ter formato válido (00.000.000/0000-00 ou 00000000000000)'
        }),

  // Prioridade
  priority: Joi.number().integer().min(1).max(5).default(3).messages({
    'number.min': 'Prioridade deve ser entre 1 e 5',
    'number.max': 'Prioridade deve ser entre 1 e 5'
        })
        };

/**
 * Função helper para criar validação de array
 */
export const arrayOf = (schema: Schema) => Joi.array().items(schema);

/**
 * Função helper para campos opcionais
 */
export const optional = (schema: Schema) => schema.optional().allow(null, '');

/**
 * Validação customizada para telefone brasileiro
 */
export const phoneValidator = Joi.string()
  .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/)
  .messages({
    'string.pattern.base': 'Telefone deve ter formato válido ((00) 00000-0000 ou 0000000000)'
        });

/**
 * Middleware de tratamento de erros de validação global usando tipos centralizados
 */
export const validationErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  // Type guard para verificar se é um erro Joi
  const isJoiError = (err: unknown): err is JoiValidationError => {
    return (
      typeof err === 'object' &&
      err !== null &&
      'isJoi' in err &&
      (err as JoiValidationError).isJoi === true &&
      'details' in err &&
      Array.isArray((err as JoiValidationError).details)
    );
  };

  if (isJoiError(error)) {
    const response: ValidationErrorResponse = {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Dados fornecidos são inválidos',
      details: error.details.map(
        (detail: JoiErrorDetail) =>
          ({
            field: detail.path?.join('.') || 'unknown',
            message: detail.message,
            value: detail.context?.value
        }) as ValidationErrorDetail
      )
        };

    return res.status(400).json(response);
  }

  next(error);
};
