import { randomUUID } from 'node:crypto';
import {
  BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException,
  Get, NotFoundException, Param, Patch, Post, Req,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { TenantScopedRepository } from '../common/utils/tenant-scoped.repository';

interface Checkin {
  id: string;
  hospitalId: string;
  patientId: string;
  name: string;
  purpose: string;
  location: string;
  status: string;
  time: string;
  history: { label: string; time: string }[];
}

type StaffRequest = { user: { hospitalId?: string } };

@Controller('checkins')
@Roles(UserRole.ADMINISTRATIVE_STAFF)
export class CheckinsController {
  private readonly repository = new TenantScopedRepository<Checkin>('checkins.json');

  private hospital(request: StaffRequest) {
    const hospitalId = request.user.hospitalId;
    if (!hospitalId) throw new ForbiddenException('Your account has no assigned hospital');
    return hospitalId;
  }

  private field(value: unknown, label: string, min: number, max: number) {
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
      throw new BadRequestException(label + ' must be ' + min + ' to ' + max + ' characters');
    }
    return value.trim();
  }

  @Get()
  list(@Req() request: StaffRequest) {
    return this.repository.findAll(this.hospital(request)).reverse();
  }

  @Post()
  create(@Req() request: StaffRequest, @Body() data: Record<string, unknown>) {
    const hospitalId = this.hospital(request);
    const patientId = this.field(data?.patientId, 'Patient ID', 2, 32);
    const name = this.field(data?.name, 'Name', 1, 150);
    const purpose = this.field(data?.purpose, 'Visit purpose', 3, 80);
    if (this.repository.findAll(hospitalId).some((row) => row.patientId.toLowerCase() === patientId.toLowerCase())) {
      throw new ConflictException('This patient is already checked in');
    }
    const time = new Date().toISOString();
    const entry: Checkin = {
      id: randomUUID(), hospitalId, patientId, name, purpose, time,
      status: 'Waiting', location: 'Reception', history: [{ label: 'Reception', time }],
    };
    this.repository.insert(entry);
    return entry;
  }

  @Patch(':id')
  move(@Req() request: StaffRequest, @Param('id') id: string, @Body('location') value: unknown) {
    const hospitalId = this.hospital(request);
    const row = this.repository.findById(id, 'id', hospitalId);
    if (!row) throw new NotFoundException('Check-in not found');
    const location = this.field(value, 'Location', 1, 120);
    const normalized = location.toLowerCase();
    const status = normalized.includes('consultation') ? 'In Consultation' : /^er\b/.test(normalized) ? 'In ER' : 'Moving';
    const entry = { ...row, location, status, history: [...row.history, { label: location, time: new Date().toISOString() }] };
    this.repository.updateById(id, entry, hospitalId);
    return entry;
  }

  @Delete(':id')
  remove(@Req() request: StaffRequest, @Param('id') id: string) {
    if (!this.repository.deleteById(id, this.hospital(request))) throw new NotFoundException('Check-in not found');
    return { id };
  }
}
