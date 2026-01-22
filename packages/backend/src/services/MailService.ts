import nodemailer from 'nodemailer';

interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

export class MailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendMail({ to, subject, html }: MailOptions): Promise<void> {
        const from = process.env.SMTP_FROM || '"Vangarments" <noreply@vangarments.com>';

        try {
            if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
                console.log('========== MOCK EMAIL SEND ==========');
                console.log(`To: ${to}`);
                console.log(`Subject: ${subject}`);
                console.log('HTML:', html);
                console.log('=====================================');
                return;
            }

            await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
            });
            console.log(`Email sent to ${to}`);
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't throw in dev/test if config is missing, just log
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
        }
    }

    async sendVerificationEmail(to: string, token: string): Promise<void> {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const verificationLink = `${appUrl}/verify-email?token=${token}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Thank you for registering with Vangarments. Please click the link below to verify your email address:</p>
        <p>
          <a href="${verificationLink}" style="display: inline-block; background-color: #00132d; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;

        await this.sendMail({
            to,
            subject: 'Verify your email address - Vangarments',
            html,
        });
    }
}

export const mailService = new MailService();
