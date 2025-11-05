"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const calls_module_1 = require("./calls/calls.module");
const asterisk_module_1 = require("./asterisk/asterisk.module");
const tts_module_1 = require("./tts/tts.module");
const incoming_calls_module_1 = require("./incoming-calls/incoming-calls.module");
const stasis_module_1 = require("./stasis/stasis.module");
const ari_module_1 = require("./ari/ari.module");
const scheduled_call_entity_1 = require("./entities/scheduled-call.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: 'voicedesk.db',
                entities: [scheduled_call_entity_1.ScheduledCall],
                synchronize: true,
            }),
            calls_module_1.CallsModule,
            asterisk_module_1.AsteriskModule,
            tts_module_1.TtsModule,
            incoming_calls_module_1.IncomingCallsModule,
            stasis_module_1.StasisModule,
            ari_module_1.AriModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map