import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('smtp.host');
    const smtpPort = this.configService.get<number>('smtp.port');
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');

    const transporterConfig: any = {
      host: smtpHost,
      port: smtpPort,
      secure: false,
      // Disable TLS certificate validation for Maildev (development only)
      // This is safe for local development with Maildev
      tls: {
        rejectUnauthorized: false,
      },
    };

    // Only add authentication if both user and pass are provided and non-empty
    // This allows Maildev to work without credentials
    // Trim strings to handle empty strings from .env file (e.g., SMTP_USER="")
    const hasAuth = smtpUser?.trim() && smtpPass?.trim();
    if (hasAuth) {
      transporterConfig.auth = {
        user: smtpUser!.trim(),
        pass: smtpPass!.trim(),
      };
      this.logger.log(`SMTP authentication enabled for ${smtpHost}:${smtpPort}`);
    } else {
      this.logger.log(`SMTP authentication disabled (connecting to ${smtpHost}:${smtpPort})`);
    }

    this.transporter = nodemailer.createTransport(transporterConfig);
  }

  async sendEmailVerification(email: string, token: string, firstName: string) {
    const appUrl = this.configService.get<string>('app.url');
    const verificationLink = `${appUrl}/api/auth/verify-email?token=${token}`;
    console.log("verificationLink", verificationLink);

    const mailOptions = {
      from: this.configService.get<string>('smtp.from'),
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome ${firstName}!</h2>
          <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
          <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email verification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email verification to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, token: string, firstName: string) {
    const appUrl = this.configService.get<string>('app.url');
    const resetLink = `${appUrl}/api/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('smtp.from'),
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordChanged(email: string, firstName: string) {
    const mailOptions = {
      from: this.configService.get<string>('smtp.from'),
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Changed</h2>
          <p>Hello ${firstName},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password changed notification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed notification to ${email}:`, error);
      throw error;
    }
  }
}
