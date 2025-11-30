import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    // En desarrollo usa onboarding@resend.dev, en producción tu dominio verificado
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'Vibra <onboarding@resend.dev>';
  }

  async sendVerificationEmail(email: string, code: string, username: string): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verifica tu cuenta en Vibra',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7f13ec; text-align: center;">Bienvenido a Vibra</h1>
            <p>Hola <strong>${username}</strong>,</p>
            <p>Gracias por registrarte. Tu codigo de verificacion es:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7f13ec;">${code}</span>
            </div>
            <p>Este codigo expira en <strong>15 minutos</strong>.</p>
            <p>Si no creaste esta cuenta, ignora este mensaje.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">Vibra - Tu musica, tu estilo</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Error enviando email de verificacion:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'https://vibra-kohl.vercel.app'}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Recupera tu contrasena - Vibra',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7f13ec; text-align: center;">Recuperar Contrasena</h1>
            <p>Hola <strong>${username}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contrasena. Haz clic en el boton para continuar:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #7f13ec; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Restablecer Contrasena
              </a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>Este enlace expira en <strong>1 hora</strong>.</p>
            <p>Si no solicitaste esto, ignora este mensaje. Tu contrasena no cambiara.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">Vibra - Tu musica, tu estilo</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Error enviando email de reset:', error);
      return false;
    }
  }
}
