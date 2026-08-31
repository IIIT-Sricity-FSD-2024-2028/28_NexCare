import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { UsersService } from '../users/users.service';
import { BedsService } from '../beds/beds.service';
import { InventoryService } from '../inventory/inventory.service';
import { AmbulanceService } from '../ambulance/ambulance.service';
import { ResponseUtil } from '../common/utils/response.util';

/**
 * Hospital-scoped read endpoints for the Regional Officer details tabs.
 * Kept separate from HospitalsController so other members' hospital files stay untouched.
 */
@Roles(
  UserRole.SUPERUSER,
  UserRole.REGIONAL_MANAGER,
  UserRole.HOSPITAL_MANAGER,
  UserRole.ADMINISTRATIVE_STAFF,
)
@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalDetailsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly bedsService: BedsService,
    private readonly inventoryService: InventoryService,
    private readonly ambulanceService: AmbulanceService,
  ) {}

  
  @ApiOperation({ summary: 'Get doctors' })
  @ApiResponse({ status: 200, description: 'Success' })
@Get(':id/doctors')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getDoctors(@Param('id') hospitalId: string) {
    const result = await this.usersService.findAll(UserRole.DOCTOR);
    const doctors = (result.data || []).filter(
      (user: any) => !user.hospitalId || user.hospitalId === hospitalId,
    );
    return ResponseUtil.success('Doctors retrieved successfully', doctors);
  }

  
  @ApiOperation({ summary: 'Get beds' })
  @ApiResponse({ status: 200, description: 'Success' })
@Get(':id/beds')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getBeds(@Param('id') hospitalId: string) {
    const result = await this.bedsService.findAll();
    const beds = (result.data || []).filter(
      (bed: any) => !bed.hospitalId || bed.hospitalId === hospitalId,
    );
    return ResponseUtil.success('Beds retrieved successfully', beds);
  }

  
  @ApiOperation({ summary: 'Get inventory' })
  @ApiResponse({ status: 200, description: 'Success' })
@Get(':id/inventory')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getInventory(@Param('id') hospitalId: string) {
    const result = await this.inventoryService.findAll();
    const items = (result.data || []).filter(
      (item: any) => !item.hospitalId || item.hospitalId === hospitalId,
    );
    return ResponseUtil.success('Inventory retrieved successfully', items);
  }

  
  @ApiOperation({ summary: 'Get ambulances' })
  @ApiResponse({ status: 200, description: 'Success' })
@Get(':id/ambulances')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getAmbulances(@Param('id') hospitalId: string) {
    const result = await this.ambulanceService.findAll();
    const requests = (result.data || []).filter(
      (req: any) => !req.hospitalId || req.hospitalId === hospitalId,
    );
    return ResponseUtil.success('Ambulance records retrieved successfully', requests);
  }
}
