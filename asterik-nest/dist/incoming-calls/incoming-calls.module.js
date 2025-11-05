"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingCallsModule = void 0;
const common_1 = require("@nestjs/common");
const incoming_calls_service_1 = require("./incoming-calls.service");
const tts_module_1 = require("../tts/tts.module");
const asterisk_module_1 = require("../asterisk/asterisk.module");
const ai_conversation_module_1 = require("../ai-conversation/ai-conversation.module");
let IncomingCallsModule = class IncomingCallsModule {
};
exports.IncomingCallsModule = IncomingCallsModule;
exports.IncomingCallsModule = IncomingCallsModule = __decorate([
    (0, common_1.Module)({
        imports: [tts_module_1.TtsModule, asterisk_module_1.AsteriskModule, ai_conversation_module_1.AiConversationModule],
        providers: [incoming_calls_service_1.IncomingCallsService],
        exports: [incoming_calls_service_1.IncomingCallsService],
    })
], IncomingCallsModule);
//# sourceMappingURL=incoming-calls.module.js.map