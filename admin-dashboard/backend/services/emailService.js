const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

// Create SMTP transporter using SodaHost relay
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'relay.sodahost.co.uk',
  port: parseInt(process.env.SMTP_PORT) || 26,
  secure: process.env.SMTP_SECURE === 'true', // false for port 26
  // No authentication required - IP-based authentication
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Verify SMTP connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

/**
 * Send verification email to new admin user
 */
async function sendVerificationEmail(email, username, verificationToken) {
  const verificationLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'VoiceDesk Admin'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@voicedesk.ai'}>`,
    to: email,
    subject: 'Verify Your VoiceDesk Admin Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to VoiceDesk Admin!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Thank you for signing up for VoiceDesk Admin Dashboard. Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <center>
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-left: 3px solid #667eea;">
              ${verificationLink}
            </p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>VoiceDesk AI - Intelligent Call Management System</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to VoiceDesk Admin!
      
      Hi ${username},
      
      Thank you for signing up for VoiceDesk Admin Dashboard. Please verify your email address to complete your registration.
      
      Click the link below to verify your email:
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      VoiceDesk AI - Intelligent Call Management System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, username, resetToken) {
  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'VoiceDesk Admin'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@voicedesk.ai'}>`,
    to: email,
    subject: 'Reset Your VoiceDesk Admin Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>We received a request to reset your password for your VoiceDesk Admin account.</p>
            <p>Click the button below to reset your password:</p>
            <center>
              <a href="${resetLink}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-left: 3px solid #f093fb;">
              ${resetLink}
            </p>
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>VoiceDesk AI - Intelligent Call Management System</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${username},
      
      We received a request to reset your password for your VoiceDesk Admin account.
      
      Click the link below to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email. Your password will remain unchanged.
      
      VoiceDesk AI - Intelligent Call Management System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email after successful verification
 */
async function sendWelcomeEmail(email, username) {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'VoiceDesk Admin'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@voicedesk.ai'}>`,
    to: email,
    subject: 'Welcome to VoiceDesk Admin Dashboard!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to VoiceDesk!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Congratulations! Your email has been verified successfully. You now have full access to the VoiceDesk Admin Dashboard.</p>
            
            <h3>🚀 What you can do now:</h3>
            
            <div class="feature">
              <strong>📋 View Call Transcripts</strong><br>
              Access complete conversation history for all calls
            </div>
            
            <div class="feature">
              <strong>🤖 Manage AI Prompts</strong><br>
              Customize how your AI assistant responds to calls
            </div>
            
            <div class="feature">
              <strong>💬 Update Greetings</strong><br>
              Personalize the greeting message for callers
            </div>
            
            <div class="feature">
              <strong>📊 Monitor Analytics</strong><br>
              Track call volumes and system performance
            </div>
            
            <center>
              <a href="${process.env.APP_URL}" class="button">Go to Dashboard</a>
            </center>
            
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            
            <p>Happy managing! 🎊</p>
          </div>
          <div class="footer">
            <p>VoiceDesk AI - Intelligent Call Management System</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to VoiceDesk Admin Dashboard!
      
      Hi ${username},
      
      Congratulations! Your email has been verified successfully. You now have full access to the VoiceDesk Admin Dashboard.
      
      What you can do now:
      - View Call Transcripts: Access complete conversation history
      - Manage AI Prompts: Customize AI assistant responses
      - Update Greetings: Personalize caller greetings
      - Monitor Analytics: Track call volumes and performance
      
      Access your dashboard: ${process.env.APP_URL}
      
      VoiceDesk AI - Intelligent Call Management System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};

