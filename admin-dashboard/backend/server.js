const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./services/emailService');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, email, is_verified FROM admin_users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email verification is required and user is not verified
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireVerification && !user.is_verified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup / Register new admin user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT id FROM admin_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Create user
    const result = await pool.query(
      `INSERT INTO admin_users (username, email, password_hash, verification_token, verification_token_expires, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email`,
      [username, email, hashedPassword, verificationToken, verificationExpires, false]
    );

    const newUser = result.rows[0];

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, username, verificationToken);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Continue anyway - user is created, they can request a new verification email
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      },
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email with token
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    // Find user with this verification token
    const result = await pool.query(
      'SELECT id, username, email, verification_token_expires FROM admin_users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(410).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    // Update user as verified
    await pool.query(
      `UPDATE admin_users 
       SET is_verified = true, verification_token = NULL, verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.username);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      username: user.username
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, email, is_verified FROM admin_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Update user
    await pool.query(
      'UPDATE admin_users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, user.username, verificationToken);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, email FROM admin_users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Save reset token
    await pool.query(
      'UPDATE admin_users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user with this reset token
    const result = await pool.query(
      'SELECT id, reset_token_expires FROM admin_users WHERE reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid reset token' });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(410).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE admin_users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ==================== CALL TRANSCRIPTS ROUTES ====================

// Get all call transcripts (with pagination)
app.get('/api/transcripts', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM call_transcripts');
    const total = parseInt(countResult.rows[0].count);

    // Get transcripts
    const result = await pool.query(`
      SELECT 
        id, call_id, caller_number, channel_id,
        start_time, end_time, duration_seconds, status,
        (SELECT COUNT(*) FROM call_messages WHERE call_messages.call_id = call_transcripts.call_id) as message_count
      FROM call_transcripts
      ORDER BY start_time DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      transcripts: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Get single transcript with messages
app.get('/api/transcripts/:callId', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;

    // Get transcript info
    const transcriptResult = await pool.query(
      'SELECT * FROM call_transcripts WHERE call_id = $1',
      [callId]
    );

    if (transcriptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    // Get messages
    const messagesResult = await pool.query(
      'SELECT * FROM call_messages WHERE call_id = $1 ORDER BY sequence_number, timestamp',
      [callId]
    );

    res.json({
      transcript: transcriptResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

// Create/update transcript (called by pipecat-agent)
app.post('/api/transcripts', async (req, res) => {
  try {
    const { 
      call_id, 
      caller_number, 
      channel_id, 
      messages, 
      status = 'active' 
    } = req.body;

    if (!call_id) {
      return res.status(400).json({ error: 'call_id is required' });
    }

    // Check if transcript exists
    const existing = await pool.query(
      'SELECT id FROM call_transcripts WHERE call_id = $1',
      [call_id]
    );

    let transcriptId;

    if (existing.rows.length === 0) {
      // Create new transcript
      const result = await pool.query(`
        INSERT INTO call_transcripts (call_id, caller_number, channel_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [call_id, caller_number, channel_id, status]);
      
      transcriptId = result.rows[0].id;
    } else {
      // Update existing
      transcriptId = existing.rows[0].id;
      
      if (status === 'completed') {
        await pool.query(`
          UPDATE call_transcripts 
          SET end_time = CURRENT_TIMESTAMP,
              duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)),
              status = $1
          WHERE call_id = $2
        `, [status, call_id]);
      }
    }

    // Insert messages if provided
    if (messages && Array.isArray(messages)) {
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        // Check if message already exists
        const existingMsg = await pool.query(
          'SELECT id FROM call_messages WHERE call_id = $1 AND sequence_number = $2',
          [call_id, i]
        );
        
        if (existingMsg.rows.length === 0 && msg.role !== 'system') {
          await pool.query(`
            INSERT INTO call_messages (call_id, role, content, sequence_number)
            VALUES ($1, $2, $3, $4)
          `, [call_id, msg.role, msg.content, i]);
        }
      }
    }

    res.json({ 
      success: true, 
      transcript_id: transcriptId,
      call_id 
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    res.status(500).json({ error: 'Failed to save transcript' });
  }
});

// Delete transcript
app.delete('/api/transcripts/:callId', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;

    // Delete messages first (foreign key)
    await pool.query('DELETE FROM call_messages WHERE call_id = $1', [callId]);
    
    // Delete transcript
    await pool.query('DELETE FROM call_transcripts WHERE call_id = $1', [callId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transcript:', error);
    res.status(500).json({ error: 'Failed to delete transcript' });
  }
});

// ==================== SYSTEM PROMPTS ROUTES ====================

// Get all prompts
app.get('/api/prompts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sp.*, au.username as updated_by_username
      FROM system_prompts sp
      LEFT JOIN admin_users au ON sp.updated_by = au.id
      ORDER BY created_at DESC
    `);

    res.json({ prompts: result.rows });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get active prompt
app.get('/api/prompts/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM system_prompts WHERE is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active prompt found' });
    }

    res.json({ prompt: result.rows[0] });
  } catch (error) {
    console.error('Error fetching active prompt:', error);
    res.status(500).json({ error: 'Failed to fetch active prompt' });
  }
});

// Create prompt
app.post('/api/prompts', authenticateToken, async (req, res) => {
  try {
    const { prompt_name, prompt_text, is_active } = req.body;

    if (!prompt_name || !prompt_text) {
      return res.status(400).json({ error: 'prompt_name and prompt_text are required' });
    }

    // If setting as active, deactivate all others
    if (is_active) {
      await pool.query('UPDATE system_prompts SET is_active = false');
    }

    const result = await pool.query(`
      INSERT INTO system_prompts (prompt_name, prompt_text, is_active, updated_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [prompt_name, prompt_text, is_active || false, req.user.id]);

    res.json({ prompt: result.rows[0] });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// Update prompt
app.put('/api/prompts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt_name, prompt_text, is_active } = req.body;

    // If setting as active, deactivate all others
    if (is_active) {
      await pool.query('UPDATE system_prompts SET is_active = false WHERE id != $1', [id]);
    }

    const result = await pool.query(`
      UPDATE system_prompts 
      SET prompt_name = COALESCE($1, prompt_name),
          prompt_text = COALESCE($2, prompt_text),
          is_active = COALESCE($3, is_active),
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $4
      WHERE id = $5
      RETURNING *
    `, [prompt_name, prompt_text, is_active, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({ prompt: result.rows[0] });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Delete prompt
app.delete('/api/prompts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's the active prompt
    const checkResult = await pool.query(
      'SELECT is_active FROM system_prompts WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (checkResult.rows[0].is_active) {
      return res.status(400).json({ error: 'Cannot delete active prompt' });
    }

    await pool.query('DELETE FROM system_prompts WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// ==================== GREETING MESSAGES ROUTES ====================

// Get all greetings
app.get('/api/greetings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT gm.*, au.username as updated_by_username
      FROM greeting_messages gm
      LEFT JOIN admin_users au ON gm.updated_by = au.id
      ORDER BY created_at DESC
    `);

    res.json({ greetings: result.rows });
  } catch (error) {
    console.error('Error fetching greetings:', error);
    res.status(500).json({ error: 'Failed to fetch greetings' });
  }
});

// Get active greeting
app.get('/api/greetings/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM greeting_messages WHERE is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active greeting found' });
    }

    res.json({ greeting: result.rows[0] });
  } catch (error) {
    console.error('Error fetching active greeting:', error);
    res.status(500).json({ error: 'Failed to fetch active greeting' });
  }
});

// Create greeting
app.post('/api/greetings', authenticateToken, async (req, res) => {
  try {
    const { message_text, is_active } = req.body;

    if (!message_text) {
      return res.status(400).json({ error: 'message_text is required' });
    }

    // If setting as active, deactivate all others
    if (is_active) {
      await pool.query('UPDATE greeting_messages SET is_active = false');
    }

    const result = await pool.query(`
      INSERT INTO greeting_messages (message_text, is_active, updated_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [message_text, is_active || false, req.user.id]);

    res.json({ greeting: result.rows[0] });
  } catch (error) {
    console.error('Error creating greeting:', error);
    res.status(500).json({ error: 'Failed to create greeting' });
  }
});

// Update greeting
app.put('/api/greetings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message_text, is_active } = req.body;

    // If setting as active, deactivate all others
    if (is_active) {
      await pool.query('UPDATE greeting_messages SET is_active = false WHERE id != $1', [id]);
    }

    const result = await pool.query(`
      UPDATE greeting_messages 
      SET message_text = COALESCE($1, message_text),
          is_active = COALESCE($2, is_active),
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
      WHERE id = $4
      RETURNING *
    `, [message_text, is_active, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Greeting not found' });
    }

    res.json({ greeting: result.rows[0] });
  } catch (error) {
    console.error('Error updating greeting:', error);
    res.status(500).json({ error: 'Failed to update greeting' });
  }
});

// Delete greeting
app.delete('/api/greetings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's the active greeting
    const checkResult = await pool.query(
      'SELECT is_active FROM greeting_messages WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Greeting not found' });
    }

    if (checkResult.rows[0].is_active) {
      return res.status(400).json({ error: 'Cannot delete active greeting' });
    }

    await pool.query('DELETE FROM greeting_messages WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting greeting:', error);
    res.status(500).json({ error: 'Failed to delete greeting' });
  }
});

// ==================== DASHBOARD STATS ====================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Total calls
    const totalCallsResult = await pool.query('SELECT COUNT(*) FROM call_transcripts');
    
    // Calls today
    const todayCallsResult = await pool.query(`
      SELECT COUNT(*) FROM call_transcripts 
      WHERE DATE(start_time) = CURRENT_DATE
    `);
    
    // Average call duration
    const avgDurationResult = await pool.query(`
      SELECT AVG(duration_seconds) as avg_duration 
      FROM call_transcripts 
      WHERE duration_seconds IS NOT NULL
    `);
    
    // Calls by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM call_transcripts 
      GROUP BY status
    `);

    res.json({
      totalCalls: parseInt(totalCallsResult.rows[0].count),
      callsToday: parseInt(todayCallsResult.rows[0].count),
      avgDuration: Math.round(parseFloat(avgDurationResult.rows[0].avg_duration || 0)),
      callsByStatus: statusResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VoiceDesk Admin Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`💾 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

