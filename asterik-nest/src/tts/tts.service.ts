import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly elevenLabsApiKey: string;
  private readonly openaiApiKey: string;
  private readonly audioDir: string;

  constructor(private configService: ConfigService) {
    this.elevenLabsApiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.audioDir = path.join(process.cwd(), 'audio');
    
    // Create audio directory if it doesn't exist
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Generate speech using ElevenLabs
   */
  async generateSpeech(text: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB'): Promise<string> {
    try {
      this.logger.log(`Generating speech for text: ${text.substring(0, 50)}...`);

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          },
          output_format: 'ulaw_8000'
        },
        {
          headers: {
            'Accept': 'audio/basic',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          responseType: 'arraybuffer'
        }
      );

      // Save audio file in format Asterisk can play
      const fileName = `intro_${Date.now()}.ulaw`;
      const filePath = path.join(this.audioDir, fileName);
      
      fs.writeFileSync(filePath, response.data);
      
      this.logger.log(`Audio file saved: ${filePath}`);
      return filePath;

    } catch (error) {
      this.logger.error('Error generating speech with ElevenLabs:', error.message);
      throw error;
    }
  }

  /**
   * Generate speech using OpenAI TTS
   */
  async generateSpeechOpenAI(text: string, voice: string = 'alloy'): Promise<string> {
    try {
      this.logger.log(`Generating speech with OpenAI for text: ${text.substring(0, 50)}...`);

      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: text,
          voice: voice
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // Save audio file
      const fileName = `intro_openai_${Date.now()}.mp3`;
      const filePath = path.join(this.audioDir, fileName);
      
      fs.writeFileSync(filePath, response.data);
      
      this.logger.log(`OpenAI audio file saved: ${filePath}`);
      return filePath;

    } catch (error) {
      this.logger.error('Error generating speech with OpenAI:', error.message);
      throw error;
    }
  }

  /**
   * Generate intro message using AI
   */
  async generateIntroMessage(callerNumber?: string): Promise<string> {
    try {
      this.logger.log('Generating intro message with OpenAI...');

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional phone system. Generate a brief, friendly intro message for incoming calls. Keep it under 20 words and make it welcoming.'
            },
            {
              role: 'user',
              content: `Generate an intro message for a call from ${callerNumber || 'a caller'}.`
            }
          ],
          max_tokens: 50,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const introText = response.data.choices[0].message.content.trim();
      this.logger.log(`Generated intro message: ${introText}`);
      return introText;

    } catch (error) {
      this.logger.error('Error generating intro message:', error.message);
      // Fallback to predefined messages
      return this.getFallbackIntroMessage(callerNumber);
    }
  }

  /**
   * Get fallback intro message when AI is unavailable
   */
  private getFallbackIntroMessage(callerNumber?: string): string {
    const messages = [
      'Hello! Thank you for calling. Please hold while we connect you to an agent.',
      'Welcome! Thank you for calling. We will connect you shortly.',
      'Hello! Thanks for calling. Please hold for a moment.',
      'Good day! Thank you for calling. We are connecting you now.',
      'Hello! Thank you for your call. Please hold while we transfer you.'
    ];
    
    // Use caller number to pick a consistent message
    const index = callerNumber ? callerNumber.length % messages.length : 0;
    return messages[index];
  }

  /**
   * Create complete intro audio file
   */
  async createIntroAudio(callerNumber?: string): Promise<string> {
    try {
      // Generate intro message
      const introText = await this.generateIntroMessage(callerNumber);
      
      // Generate speech (try ElevenLabs first, fallback to OpenAI)
      try {
        return await this.generateSpeech(introText);
      } catch (elevenLabsError) {
        this.logger.warn('ElevenLabs failed, falling back to OpenAI TTS');
        return await this.generateSpeechOpenAI(introText);
      }

    } catch (error) {
      this.logger.error('Error creating intro audio:', error.message);
      throw error;
    }
  }

  /**
   * Get the default intro message
   */
  getDefaultIntroMessage(): string {
    return 'Hello! Thank you for calling. Please hold while we connect you to an agent.';
  }
}
