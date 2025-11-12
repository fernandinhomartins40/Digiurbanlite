import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Citizen } from '@prisma/client';
import { CitizenAuthenticatedRequest, JWTPayload } from '../types';

/**
 * Middleware de autenticação para cidadãos
 * Valida token JWT específico para portal do cidadão
 */
export const citizenAuthMiddleware = async (
  req: Request, // CRIADO: compatibilidade Express genérica
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ Tentar obter token do cookie primeiro, depois do header (fallback)
    let token = (req as any).cookies?.digiurban_citizen_token;

    // Fallback para header Authorization (compatibilidade temporária)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Token de acesso necessário' });
      return;
    }

    // Verificar e decodificar o token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Configuração de segurança inválida' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload & {
      citizenId: string;
      type: string;
    };

    // Verificar se é um token de cidadão
    if (decoded.type !== 'citizen') {
      res.status(401).json({ error: 'Token inválido para acesso cidadão' });
      return;
    }

    // Single tenant: verificação de tenant removida

    // Buscar o cidadão no banco com validação de segurança
    const citizen: Citizen | null = await prisma.citizen.findFirst({
      where: {
        id: decoded.citizenId,
        isActive: true
      }
      });

    if (!citizen) {
      res.status(401).json({ error: 'Cidadão não encontrado ou inativo' });
      return;
    }

    // Adicionar cidadão e informações à requisição com conversão de tipos
    // CRIADO: type assertion para compatibilidade
    (req as any).citizen = {
      id: citizen.id,
      cpf: citizen.cpf,
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone || undefined,
      isActive: citizen.isActive,
      createdAt: citizen.createdAt,
      updatedAt: citizen.updatedAt,
      lastLogin: citizen.lastLogin || undefined,
      birthDate: citizen.birthDate || undefined
    };
    // CRIADO: type assertion para compatibilidade Express + funcionalidade
    (req as any).citizenId = citizen.id;

    next();
  } catch (error: unknown) {
    console.error('Erro na autenticação do cidadão:', error);

    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expirado' });
        return;
      }
    }

    res.status(500).json({ error: 'Erro interno na autenticação' });
      }
};

/**
 * Middleware opcional para verificar autorização da família
 * Permite que cidadão acesse dados de seus familiares
 */
export const familyAuthMiddleware = async (
  req: CitizenAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { citizen } = req;

    // Verificar se citizen existe e está autenticado
    if (!citizen) {
      res.status(401).json({ error: 'Cidadão não autenticado' });
      return;
    }

    const citizenId = req.params.citizenId || req.body.citizenId;

    if (!citizenId) {
      next(); // Se não há citizenId específico, prosseguir
      return;
    }

    // Se está acessando seus próprios dados
    if (citizenId === citizen.id) {
      next();
      return;
    }

    // Verificar se é membro da família com segurança
    const familyRelation = await prisma.familyComposition.findFirst({
      where: {
        headId: citizen.id,
        memberId: citizenId
      }
    });

    if (!familyRelation) {
      res.status(403).json({
        error: 'Acesso negado: você só pode acessar dados seus ou de familiares'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de autorização familiar:', error);
    res.status(500).json({ error: 'Erro interno na autorização' });
      }
};

/**
 * Middleware para validar acesso apenas aos próprios dados do cidadão
 */
export const requireSelfAccess = (
  req: CitizenAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { citizen } = req;

  if (!citizen) {
    res.status(401).json({ error: 'Cidadão não autenticado' });
    return;
  }

  const citizenId = req.params.citizenId || req.body.citizenId;

  // Se não há citizenId específico, permitir
  if (!citizenId) {
    next();
    return;
  }

  // Verificar se está acessando seus próprios dados
  if (citizenId !== citizen.id) {
    res.status(403).json({
      error: 'Acesso negado: você só pode acessar seus próprios dados'
      });
    return;
  }

  next();
};
