const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating database tables...');
    
    // Create admin users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);
    console.log('✅ admin_users table created');
    
    // Create system prompts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_prompts (
        id SERIAL PRIMARY KEY,
        prompt_name VARCHAR(100) NOT NULL,
        prompt_text TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES admin_users(id)
      );
    `);
    console.log('✅ system_prompts table created');
    
    // Create greeting messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS greeting_messages (
        id SERIAL PRIMARY KEY,
        message_text TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES admin_users(id)
      );
    `);
    console.log('✅ greeting_messages table created');
    
    // Create call_transcripts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS call_transcripts (
        id SERIAL PRIMARY KEY,
        call_id VARCHAR(100) UNIQUE NOT NULL,
        caller_number VARCHAR(50),
        channel_id VARCHAR(100),
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        duration_seconds INTEGER,
        transcript_json JSONB,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ call_transcripts table created');
    
    // Create call_messages table (for individual messages)
    await client.query(`
      CREATE TABLE IF NOT EXISTS call_messages (
        id SERIAL PRIMARY KEY,
        call_id VARCHAR(100) REFERENCES call_transcripts(call_id),
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sequence_number INTEGER
      );
    `);
    console.log('✅ call_messages table created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_call_transcripts_call_id ON call_transcripts(call_id);
      CREATE INDEX IF NOT EXISTS idx_call_transcripts_start_time ON call_transcripts(start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_call_messages_call_id ON call_messages(call_id);
    `);
    console.log('✅ Indexes created');
    
    // Insert default admin user if doesn't exist
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@voicedesk.ai';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const existingAdmin = await client.query(
      'SELECT id FROM admin_users WHERE username = $1 OR email = $2',
      [defaultUsername, defaultEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      await client.query(
        'INSERT INTO admin_users (username, email, password_hash, is_verified) VALUES ($1, $2, $3, $4)',
        [defaultUsername, defaultEmail, hashedPassword, true]
      );
      console.log(`✅ Default admin user created:`);
      console.log(`   Username: ${defaultUsername}`);
      console.log(`   Email: ${defaultEmail}`);
      console.log(`   Password: ${defaultPassword}`);
      console.log('   Verified: Yes (default admin)');
      console.log('⚠️  IMPORTANT: Change the default password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Insert default system prompt if doesn't exist
    const existingPrompt = await client.query('SELECT id FROM system_prompts WHERE is_active = true');
    
    if (existingPrompt.rows.length === 0) {
      await client.query(`
        INSERT INTO system_prompts (prompt_name, prompt_text, is_active, updated_by)
        VALUES ($1, $2, $3, $4)
      `, [
        'Default Prompt',
        'You are a helpful AI assistant on a phone call. Keep responses VERY brief - one short sentence at a time. Pause after each sentence to let the user respond. This is a real-time conversation, so be concise.',
        true,
        1
      ]);
      console.log('✅ Default system prompt created');
    }
    
    // Insert default greeting if doesn't exist
    const existingGreeting = await client.query('SELECT id FROM greeting_messages WHERE is_active = true');
    
    if (existingGreeting.rows.length === 0) {
      await client.query(`
        INSERT INTO greeting_messages (message_text, is_active, updated_by)
        VALUES ($1, $2, $3)
      `, [
        'Hello! How can I help you?',
        true,
        1
      ]);
      console.log('✅ Default greeting message created');
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy config.env to .env: cp config.env .env');
    console.log('2. Install dependencies: npm install');
    console.log('3. Start the server: npm start');
    console.log(`4. Login with: ${defaultUsername} / ${defaultPassword}`);
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the initialization
createTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

