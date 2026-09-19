import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import {
  credentialsHtml,
  credentialsSubject,
  credentialsText,
  type CredentialsMail,
} from './credentials-template.js';

export type MailResult =
  | { sent: true; to: string }
  | {
      sent: false;
      reason: 'not_configured' | 'provider_error';
      message?: string;
    };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(
      this.config.get<string>('SMTP_HOST') &&
      this.config.get<string>('MAIL_FROM'),
    );
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port,
      secure:
        (this.config.get<string>('SMTP_SECURE') ?? String(port === 465)) ===
        'true',
      ...(user && { auth: { user, pass } }),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    return this.transporter;
  }

  async sendCredentials(input: CredentialsMail): Promise<MailResult> {
    if (!this.isConfigured()) return { sent: false, reason: 'not_configured' };
    const appUrl = this.config.get<string>('APP_URL') || undefined;
    try {
      await this.getTransporter().sendMail({
        from: this.config.get<string>('MAIL_FROM'),
        to: input.email,
        subject: credentialsSubject(input),
        text: credentialsText(input, appUrl),
        html: credentialsHtml(input, appUrl),
      });
      this.logger.log(
        `Email yuborildi: ${input.email.replace(/^(.{2}).*(@.*)$/, '$1***$2')}`,
      );
      return { sent: true, to: input.email };
    } catch (error) {
      this.logger.warn(`Email yuborilmadi: ${(error as Error).message}`);
      return {
        sent: false,
        reason: 'provider_error',
        message: (error as Error).message,
      };
    }
  }

  async status() {
    if (!this.isConfigured()) return { configured: false as const };
    try {
      await this.getTransporter().verify();
      return { configured: true as const, connected: true };
    } catch (error) {
      return {
        configured: true as const,
        connected: false,
        message: (error as Error).message,
      };
    }
  }
}
