import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  // Gmail SMTP — required for HTML support
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // Generic mail sender
  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`✅ Email sent to ${options.to}`);
    } catch (err) {
      console.error('❌ Error sending email:', err);
      throw err;
    }
  }

  // -------------------------------------------
  // 📩 Email Verification Template (HTML)
  // -------------------------------------------
  async sendVerificationEmail(email: string, code: string) {
    const subject = '🔐 Verify your Darna account';

    const html = `
      <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
        <div style="
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        ">
          <h2 style="color: #1e88e5; text-align: center;">Darna – Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering. Please use the code below to verify your email:</p>

          <div style="
              font-size: 26px;
              font-weight: bold;
              text-align: center;
              background: #1e88e5;
              color: white;
              padding: 15px;
              border-radius: 8px;
              letter-spacing: 3px;
              margin: 20px 0;
          ">${code}</div>

          <p>This code is valid for a limited time.</p>
          <p>If you did not request this, simply ignore this email.</p>

          <p style="margin-top: 20px;">Best regards,<br><strong>Darna Team</strong></p>
        </div>
      </div>
    `;

    await this.sendMail({ to: email, subject, html });
  }

  // -------------------------------------------
  // 🔄 Password Reset Template (HTML)
  // -------------------------------------------
  async sendPasswordResetEmail(email: string, code: string) {
    const subject = '🔒 Reset your Darna password';

    const html = `
      <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
        <div style="
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        ">
          <h2 style="color: #e53935; text-align: center;">Password Reset</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Use the verification code below:</p>

          <div style="
              font-size: 26px;
              font-weight: bold;
              text-align: center;
              background: #e53935;
              color: white;
              padding: 15px;
              border-radius: 8px;
              letter-spacing: 3px;
              margin: 20px 0;
          ">${code}</div>

          <p>If you did not request this, you can safely ignore this email.</p>

          <p style="margin-top: 20px;">Best regards,<br><strong>Darna Team</strong></p>
        </div>
      </div>
    `;

    await this.sendMail({ to: email, subject, html });
  }
}
