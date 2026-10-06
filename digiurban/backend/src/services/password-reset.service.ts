/**
 * Password Reset Service
 * Gerencia tokens de recuperação de senha para User e Citizen
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { TransactionalEmailService } from '../lib/email/TransactionalEmailService';
import { portalLink, sendTemplatedMail } from './mail/templated';

interface CreateResetTokenParams {
  email: string;
  userType: 'admin' | 'citizen';
}

interface ValidateTokenParams {
  token: string;
  userType: 'admin' | 'citizen';
}

interface ResetPasswordParams {
  token: string;
  newPassword: string;
  userType: 'admin' | 'citizen';
}

export class PasswordResetService {
  private emailService: TransactionalEmailService;
  private readonly TOKEN_EXPIRATION_HOURS = 1;
  private readonly WELCOME_TOKEN_HOURS = 72;

  constructor() {
    this.emailService = new TransactionalEmailService();
  }

  /**
   * Gera token único e seguro
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cria token de recuperação e envia email
   */
  async createResetToken({ email, userType }: CreateResetTokenParams): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar usuário por email e tipo
      let user: any = null;
      let userId: string | null = null;
      let citizenId: string | null = null;
      let userName: string = '';

      if (userType === 'admin') {
        user = await prisma.user.findFirst({
          where: { email, isActive: true }
        });
        if (user) {
          userId = user.id;
          userName = user.name;
        }
      } else if (userType === 'citizen') {
        user = await prisma.citizen.findFirst({
          where: { email, isActive: true }
        });
        if (user) {
          citizenId = user.id;
          userName = user.name;
        }
      }

      // Mesmo se usuário não existir, retorna sucesso (security best practice)
      if (!user) {
        return {
          success: true,
          message: 'Se o email existir, você receberá um link de recuperação em breve.'
        };
      }

      // Invalidar tokens antigos do mesmo usuário
      await prisma.passwordResetToken.updateMany({
        where: {
          email,
          userType,
          used: false
        },
        data: {
          used: true,
          usedAt: new Date()
        }
      });

      // Criar novo token
      const token = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRATION_HOURS);

      await prisma.passwordResetToken.create({
        data: {
          token,
          email,
          userType,
          userId,
          citizenId,
          expiresAt
        }
      });

      // Enviar email de recuperação
      await this.sendResetEmail({
        email,
        token,
        userName,
        userType
      });

      return {
        success: true,
        message: 'Se o email existir, você receberá um link de recuperação em breve.'
      };

    } catch (error) {
      console.error('Error creating reset token:', error);
      throw new Error('Erro ao processar solicitação de recuperação de senha');
    }
  }

  /**
   * Valida token de recuperação
   */
  async validateToken({ token, userType }: ValidateTokenParams): Promise<{ valid: boolean; email?: string }> {
    try {
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token,
          userType,
          used: false,
          expiresAt: {
            gte: new Date()
          }
        }
      });

      if (!resetToken) {
        return { valid: false };
      }

      return {
        valid: true,
        email: resetToken.email
      };

    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false };
    }
  }

  /**
   * Redefine senha usando token
   */
  async resetPassword({ token, newPassword, userType }: ResetPasswordParams): Promise<{ success: boolean; message: string }> {
    try {
      // Validar token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token,
          userType,
          used: false,
          expiresAt: {
            gte: new Date()
          }
        }
      });

      if (!resetToken) {
        return {
          success: false,
          message: 'Token inválido ou expirado'
        };
      }

      // Hash da nova senha
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Atualizar senha
      if (userType === 'admin' && resetToken.userId) {
        await prisma.user.update({
          where: { id: resetToken.userId },
          data: {
            password: passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null
          }
        });
      } else if (userType === 'citizen' && resetToken.citizenId) {
        await prisma.citizen.update({
          where: { id: resetToken.citizenId },
          data: {
            password: passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null
          }
        });
      } else {
        return {
          success: false,
          message: 'Token inválido'
        };
      }

      // Marcar token como usado
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          used: true,
          usedAt: new Date()
        }
      });

      return {
        success: true,
        message: 'Senha redefinida com sucesso'
      };

    } catch (error) {
      console.error('Error resetting password:', error);
      throw new Error('Erro ao redefinir senha');
    }
  }

  /**
   * Envia email de recuperação (modelo "password-recovery")
   */
  private async sendResetEmail({ email, token, userName, userType }: {
    email: string;
    token: string;
    userName: string;
    userType: 'admin' | 'citizen';
  }): Promise<void> {
    try {
      // link no endereço do município (a sessão e o cookie ficam presos ao subdomínio)
      const resetPath = userType === 'admin' ? '/admin/reset-password' : '/cidadao/reset-password';
      const result = await sendTemplatedMail({
        template: 'password-recovery',
        to: email,
        priority: 'critical',
        variables: {
          userName: userName.trim().split(' ')[0],
          recoveryUrl: await portalLink(`${resetPath}?token=${token}`),
          portalName: userType === 'admin' ? 'painel dos servidores' : 'Portal do Cidadão',
          expirationText: `${this.TOKEN_EXPIRATION_HOURS} hora${this.TOKEN_EXPIRATION_HOURS === 1 ? '' : 's'}`,
        },
      });
      if (!result.queued) console.warn('[Password Reset] E-mail não enfileirado:', result.reason);
    } catch (error) {
      console.error('Error sending reset email:', error);
      // Não lançar erro - email é secundário
    }
  }

  /**
   * Cidadão cadastrado pela prefeitura sem senha: manda o link para ele criar a
   * própria senha (modelo "citizen-account-created"). O link vale 3 dias.
   */
  async sendCitizenAccountCreated(citizen: { id: string; email: string | null; name: string }): Promise<void> {
    if (!citizen.email) return;
    try {
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + this.WELCOME_TOKEN_HOURS * 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: { token, email: citizen.email, userType: 'citizen', citizenId: citizen.id, expiresAt },
      });
      const result = await sendTemplatedMail({
        template: 'citizen-account-created',
        to: citizen.email,
        priority: 'critical',
        variables: {
          citizenName: citizen.name.trim().split(' ')[0],
          setPasswordUrl: await portalLink(`/cidadao/reset-password?token=${token}`),
          expirationText: '3 dias',
        },
      });
      if (!result.queued) console.warn('[Conta criada] E-mail não enfileirado:', result.reason);
    } catch (error) {
      console.error('Erro ao enviar e-mail de conta criada:', error);
    }
  }

  /**
   * Limpa tokens expirados (cronjob)
   */
  async cleanExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              used: true,
              usedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 dias atrás
            }
          ]
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning expired tokens:', error);
      return 0;
    }
  }
}
