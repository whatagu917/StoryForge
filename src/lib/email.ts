import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Gmail SMTPの設定
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// 確認トークンの生成
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 確認リンクの生成
export function generateVerificationUrl(token: string): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://storyforge.vercel.app'
    : 'http://localhost:3000';
  return `${baseUrl}/auth/verify?token=${token}`;
}

// メール送信関数
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  console.log('=== Email Send Attempt ===');
  console.log('To:', to);
  console.log('Subject:', subject);

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to,
      subject,
      html,
    };

    console.log('Attempting to send email via Gmail SMTP...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error: any) {
    console.error('=== Email Send Error ===');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }
}

// 確認メールを送信する関数
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  console.log('=== Sending Verification Email ===');
  console.log('To:', email);
  const verificationUrl = generateVerificationUrl(token);
  
  const html = `
    <h1>StoryForge メールアドレス確認</h1>
    <p>ご登録ありがとうございます。以下のリンクをクリックして、メールアドレスを確認してください。</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>このメールに心当たりがない場合は、無視してください。</p>
  `;

  await sendEmail(email, 'メールアドレスの確認', html);
}

// パスワードリセットトークンの生成
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// パスワードリセットリンクの生成
export function generatePasswordResetUrl(email: string, token: string): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://storyforge.vercel.app'
    : 'http://localhost:3000';
  return `${baseUrl}/auth/reset-password?token=${token}`;
}

// パスワードリセットメールを送信する関数
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  console.log('=== Sending Password Reset Email ===');
  console.log('To:', email);
  const resetUrl = generatePasswordResetUrl(email, token);
  
  const html = `
    <h1>StoryForge パスワードリセット</h1>
    <p>パスワードリセットのリクエストを受け付けました。以下のリンクをクリックして、新しいパスワードを設定してください。</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>このリンクは1時間有効です。</p>
    <p>このメールに心当たりがない場合は、無視してください。</p>
  `;

  await sendEmail(email, 'パスワードリセット', html);
} 