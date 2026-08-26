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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_util_1 = require("../utils/response.util");
const roles_decorator_1 = require("../decorators/roles.decorator");
const api_response_interface_1 = require("../interfaces/api-response.interface");
const file_logger_1 = require("./file-logger");
const STREAMS = ['access', 'error', 'app'];
let LogsController = class LogsController {
    async read(stream = 'access', limit = '100') {
        if (!STREAMS.includes(stream)) {
            return response_util_1.ResponseUtil.error(`Unknown log stream "${stream}". Valid streams: ${STREAMS.join(', ')}.`);
        }
        const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
        const entries = file_logger_1.fileLogger.readRecent(stream, parsedLimit);
        return response_util_1.ResponseUtil.success(`${stream} log retrieved successfully`, entries);
    }
    async files() {
        return response_util_1.ResponseUtil.success('Log files retrieved successfully', file_logger_1.fileLogger.listFiles());
    }
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Read recent log entries' }),
    (0, swagger_1.ApiQuery)({ name: 'stream', required: false, enum: STREAMS }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 100 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recent log entries' }),
    __param(0, (0, common_1.Query)('stream')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "read", null);
__decorate([
    (0, common_1.Get)('files'),
    (0, swagger_1.ApiOperation)({ summary: 'List log files with sizes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Log files on disk' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "files", null);
exports.LogsController = LogsController = __decorate([
    (0, swagger_1.ApiTags)('Logs'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('logs')
], LogsController);
//# sourceMappingURL=logs.controller.js.map