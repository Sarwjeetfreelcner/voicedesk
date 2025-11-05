"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TtsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const fs = require("fs");
const path = require("path");
let TtsService = TtsService_1 = class TtsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TtsService_1.name);
        this.elevenLabsApiKey = this.configService.get('ELEVENLABS_API_KEY');
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
        this.audioDir = path.join(process.cwd(), 'audio');
        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }
    }
    async generateSpeech(text, voiceId = 'pNInz6obpgDQGcFmaJgB') {
        try {
            this.logger.log(`Generating speech for text: ${text.substring(0, 50)}...`);
            const response = await axios_1.default.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                },
                output_format: 'ulaw_8000'
            }, {
                headers: {
                    'Accept': 'audio/basic',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsApiKey
                },
                responseType: 'arraybuffer'
            });
            const fileName = `intro_${Date.now()}.ulaw`;
            const filePath = path.join(this.audioDir, fileName);
            fs.writeFileSync(filePath, response.data);
            this.logger.log(`Audio file saved: ${filePath}`);
            return filePath;
        }
        catch (error) {
            this.logger.error('Error generating speech with ElevenLabs:', error.message);
            throw error;
        }
    }
    async generateSpeechOpenAI(text, voice = 'alloy') {
        try {
            this.logger.log(`Generating speech with OpenAI for text: ${text.substring(0, 50)}...`);
            const response = await axios_1.default.post('https://api.openai.com/v1/audio/speech', {
                model: 'tts-1',
                input: text,
                voice: voice
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            });
            const fileName = `intro_openai_${Date.now()}.mp3`;
            const filePath = path.join(this.audioDir, fileName);
            fs.writeFileSync(filePath, response.data);
            this.logger.log(`OpenAI audio file saved: ${filePath}`);
            return filePath;
        }
        catch (error) {
            this.logger.error('Error generating speech with OpenAI:', error.message);
            throw error;
        }
    }
    async generateIntroMessage(callerNumber) {
        try {
            this.logger.log('Generating intro message with OpenAI...');
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const introText = response.data.choices[0].message.content.trim();
            this.logger.log(`Generated intro message: ${introText}`);
            return introText;
        }
        catch (error) {
            this.logger.error('Error generating intro message:', error.message);
            return this.getFallbackIntroMessage(callerNumber);
        }
    }
    getFallbackIntroMessage(callerNumber) {
        const messages = [
            'Hello! Thank you for calling. Please hold while we connect you to an agent.',
            'Welcome! Thank you for calling. We will connect you shortly.',
            'Hello! Thanks for calling. Please hold for a moment.',
            'Good day! Thank you for calling. We are connecting you now.',
            'Hello! Thank you for your call. Please hold while we transfer you.'
        ];
        const index = callerNumber ? callerNumber.length % messages.length : 0;
        return messages[index];
    }
    async createIntroAudio(callerNumber) {
        try {
            const introText = await this.generateIntroMessage(callerNumber);
            try {
                return await this.generateSpeech(introText);
            }
            catch (elevenLabsError) {
                this.logger.warn('ElevenLabs failed, falling back to OpenAI TTS');
                return await this.generateSpeechOpenAI(introText);
            }
        }
        catch (error) {
            this.logger.error('Error creating intro audio:', error.message);
            throw error;
        }
    }
    getDefaultIntroMessage() {
        return 'Hello! Thank you for calling. Please hold while we connect you to an agent.';
    }
};
exports.TtsService = TtsService;
exports.TtsService = TtsService = TtsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TtsService);
//# sourceMappingURL=tts.service.js.map