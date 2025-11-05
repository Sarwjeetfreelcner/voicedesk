"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StasisModule = void 0;
const common_1 = require("@nestjs/common");
const stasis_service_1 = require("./stasis.service");
const incoming_calls_module_1 = require("../incoming-calls/incoming-calls.module");
let StasisModule = class StasisModule {
};
exports.StasisModule = StasisModule;
exports.StasisModule = StasisModule = __decorate([
    (0, common_1.Module)({
        imports: [incoming_calls_module_1.IncomingCallsModule],
        providers: [stasis_service_1.StasisService],
        exports: [stasis_service_1.StasisService],
    })
], StasisModule);
//# sourceMappingURL=stasis.module.js.map