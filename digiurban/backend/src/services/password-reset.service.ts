/**
 * Password Reset Service
 * Gerencia tokens de recuperação de senha para User e Citizen
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { TransactionalEmailService } from '../lib/email/TransactionalEmailService';

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
   * Envia email de recuperação
   */
  private async sendResetEmail({ email, token, userName, userType }: {
    email: string;
    token: string;
    userName: string;
    userType: 'admin' | 'citizen';
  }): Promise<void> {
    try {
      // Buscar EmailServer ativo
      const emailServer = await prisma.emailServer.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (!emailServer) {
        throw new Error('Nenhum servidor de email ativo');
      }

      // Buscar domínio configurado
      const emailDomain = await prisma.emailDomain.findFirst({
        where: {
          emailServerId: emailServer.id,
          isVerified: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!emailDomain) {
        throw new Error('Nenhum domínio de email configurado');
      }

      // URL base do frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetPath = userType === 'admin' ? '/admin/reset-password' : '/cidadao/reset-password';
      const resetUrl = `${frontendUrl}${resetPath}?token=${token}`;

      const subject = userType === 'admin'
        ? '[DigiUrban] Recuperação de Senha - Administração'
        : '[DigiUrban] Recuperação de Senha - Portal do Cidadão';

      const htmlContent = this.getEmailTemplate({
        userName,
        resetUrl,
        userType,
        expirationHours: this.TOKEN_EXPIRATION_HOURS
      });

      const textContent = `
Olá ${userName},

Recebemos uma solicitação para recuperar sua senha no ${userType === 'admin' ? 'painel administrativo' : 'Portal do Cidadão'} DigiUrban.

Clique no link abaixo para redefinir sua senha:
${resetUrl}

Este link expira em ${this.TOKEN_EXPIRATION_HOURS} hora(s).

Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.

Atenciosamente,
Equipe DigiUrban
      `.trim();

      // Enviar email via TransactionalEmailService
      await this.emailService.sendRawEmail({
        from: `noreply@${emailDomain.domainName}`,
        to: email,
        subject,
        html: htmlContent,
        text: textContent,
        emailServerId: emailServer.id,
        domainId: emailDomain.id
      });

    } catch (error) {
      console.error('Error sending reset email:', error);
      // Não lançar erro - email é secundário
    }
  }

  /**
   * Template HTML do email
   */
  private getEmailTemplate({ userName, resetUrl, userType, expirationHours }: {
    userName: string;
    resetUrl: string;
    userType: 'admin' | 'citizen';
    expirationHours: number;
  }): string {
    const title = userType === 'admin'
      ? 'Recuperação de Senha - Administração'
      : 'Recuperação de Senha - Portal do Cidadão';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🔐 Recuperação de Senha
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                Olá <strong>${userName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #666666;">
                Recebemos uma solicitação para recuperar sua senha no <strong>${userType === 'admin' ? 'painel administrativo' : 'Portal do Cidadão'}</strong> da plataforma DigiUrban.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #666666;">
                Clique no botão abaixo para criar uma nova senha:
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #856404;">
                  ⏰ <strong>Atenção:</strong> Este link expira em <strong>${expirationHours} hora(s)</strong>.
                </p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 20px; color: #999999;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; line-height: 18px; color: #667eea; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
                ${resetUrl}
              </p>

              <div style="padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #1565c0;">
                  🛡️ <strong>Segurança:</strong> Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                Atenciosamente,
              </p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #667eea;">
                Equipe DigiUrban
              </p>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} DigiUrban. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
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
