"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeavesService = void 0;
const fs = require("fs");
const path = require("path");
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let LeavesService = class LeavesService {
    constructor() {
        this.leavesFilePath = path.join(process.cwd(), 'data', 'leaves.json');
        this.leaves = this.getInitialMockData();
    }
    loadLeaves() {
        try {
            if (!fs.existsSync(this.leavesFilePath)) {
                const initial = this.getInitialMockData();
                this.saveLeaves(initial);
                return initial;
            }
            const raw = fs.readFileSync(this.leavesFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return this.getInitialMockData();
        }
    }
    saveLeaves(leaves) {
        try {
            fs.mkdirSync(path.dirname(this.leavesFilePath), { recursive: true });
            fs.writeFileSync(this.leavesFilePath, JSON.stringify(leaves, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist leaves:', err);
        }
    }
    getInitialMockData() {
        return [
            {
                id: 'L001',
                doctorId: 'U007',
                doctorName: 'Dr. Anjali Desai',
                hospitalId: 'H001',
                startDate: '2026-08-20',
                endDate: '2026-08-25',
                reason: 'Family vacation',
                status: api_response_interface_1.LeaveStatus.APPROVED,
                createdAt: '2026-08-15T00:00:00Z',
                updatedAt: '2026-08-16T00:00:00Z',
                approvedBy: 'U002',
                approvedAt: '2026-08-16T00:00:00Z'
            },
            {
                id: 'L002',
                doctorId: 'U005',
                doctorName: 'Dr. Sarah Smith',
                hospitalId: 'H001',
                startDate: '2026-09-01',
                endDate: '2026-09-03',
                reason: 'Medical conference attendance',
                status: api_response_interface_1.LeaveStatus.PENDING,
                createdAt: '2026-08-20T00:00:00Z',
                updatedAt: '2026-08-20T00:00:00Z'
            }
        ];
    }
    findAll(doctorId, hospitalId, status) {
        let filtered = [...this.leaves];
        if (doctorId) {
            filtered = filtered.filter(leave => leave.doctorId === doctorId);
        }
        if (hospitalId) {
            filtered = filtered.filter(leave => leave.hospitalId === hospitalId);
        }
        if (status) {
            filtered = filtered.filter(leave => leave.status === status);
        }
        return response_util_1.ResponseUtil.success('Leaves retrieved successfully', filtered);
    }
    findById(id) {
        const leave = this.leaves.find(l => l.id === id);
        if (!leave) {
            return response_util_1.ResponseUtil.error('Leave not found', 404);
        }
        return response_util_1.ResponseUtil.success('Leave retrieved successfully', leave);
    }
    create(createLeaveDto) {
        const newLeave = {
            id: id_generator_util_1.IdGenerator.generate('L'),
            ...createLeaveDto,
            status: api_response_interface_1.LeaveStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.leaves.push(newLeave);
        this.saveLeaves(this.leaves);
        return response_util_1.ResponseUtil.success('Leave request submitted successfully', newLeave);
    }
    update(id, updateLeaveDto) {
        const index = this.leaves.findIndex(l => l.id === id);
        if (index === -1) {
            return response_util_1.ResponseUtil.error('Leave not found', 404);
        }
        this.leaves[index] = {
            ...this.leaves[index],
            ...updateLeaveDto,
            updatedAt: new Date().toISOString(),
            approvedAt: updateLeaveDto.status === api_response_interface_1.LeaveStatus.APPROVED ? new Date().toISOString() : undefined
        };
        this.saveLeaves(this.leaves);
        return response_util_1.ResponseUtil.success('Leave status updated successfully', this.leaves[index]);
    }
    delete(id) {
        const index = this.leaves.findIndex(l => l.id === id);
        if (index === -1) {
            return response_util_1.ResponseUtil.error('Leave not found', 404);
        }
        this.leaves.splice(index, 1);
        this.saveLeaves(this.leaves);
        return response_util_1.ResponseUtil.success(null, 'Leave deleted successfully');
    }
    async hasOverlappingLeave(doctorId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const overlapping = this.leaves.some(leave => {
            if (leave.doctorId !== doctorId || leave.status !== api_response_interface_1.LeaveStatus.APPROVED) {
                return false;
            }
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            return start <= leaveEnd && end >= leaveStart;
        });
        return overlapping;
    }
    getCalendarView(hospitalId, startDate, endDate) {
        let filtered = this.leaves.filter(leave => leave.status === api_response_interface_1.LeaveStatus.APPROVED);
        if (hospitalId) {
            filtered = filtered.filter(leave => leave.hospitalId === hospitalId);
        }
        if (startDate) {
            filtered = filtered.filter(leave => leave.startDate >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(leave => leave.endDate <= endDate);
        }
        const calendarMap = new Map();
        filtered.forEach(leave => {
            const current = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                if (!calendarMap.has(dateStr)) {
                    calendarMap.set(dateStr, []);
                }
                calendarMap.get(dateStr).push({
                    doctorId: leave.doctorId,
                    doctorName: leave.doctorName,
                    reason: leave.reason
                });
                current.setDate(current.getDate() + 1);
            }
        });
        const calendarView = Array.from(calendarMap.entries()).map(([date, doctors]) => ({
            date,
            doctorsOnLeave: doctors
        }));
        return response_util_1.ResponseUtil.success('Calendar view retrieved successfully', calendarView);
    }
};
exports.LeavesService = LeavesService;
exports.LeavesService = LeavesService = __decorate([
    (0, common_1.Injectable)()
], LeavesService);
//# sourceMappingURL=leaves.service.js.map