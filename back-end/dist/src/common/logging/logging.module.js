"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingModule = void 0;
const common_1 = require("@nestjs/common");
const logs_controller_1 = require("./logs.controller");
const file_logger_1 = require("./file-logger");
let LoggingModule = class LoggingModule {
    onApplicationShutdown(signal) {
        file_logger_1.fileLogger.info('app', 'Application shutting down', { signal });
        file_logger_1.fileLogger.stop();
    }
};
exports.LoggingModule = LoggingModule;
exports.LoggingModule = LoggingModule = __decorate([
    (0, common_1.Module)({
        controllers: [logs_controller_1.LogsController],
    })
], LoggingModule);
//# sourceMappingURL=logging.module.js.map