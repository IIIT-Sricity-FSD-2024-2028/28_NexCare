import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HierarchyService } from './hierarchy.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Hierarchy Controller
 *
 * Deliberately has no `:id` route. There is no way to ask for *someone else's*
 * subtree — you get yours, computed from the token. That is what makes the
 * scope an enforcement point rather than a suggestion.
 */
@ApiTags('Hierarchy')
@ApiBearerAuth('JWT-auth')
@Roles(
  UserRole.SUPERUSER,
  UserRole.REGIONAL_MANAGER,
  UserRole.HOSPITAL_MANAGER,
  UserRole.ADMINISTRATIVE_STAFF,
)
@Controller('hierarchy')
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get()
  @ApiOperation({ summary: 'The organisational subtree rooted at the caller’s own node' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async myHierarchy(@Req() req: any) {
    return this.hierarchyService.getMyHierarchy(req.user);
  }

  /**
   * Open to every authenticated role, including the ones with no subtree — a
   * patient or ambulance driver still gets a truthful "personal scope" answer,
   * which is more useful to the frontend than a 403.
   */
  @Roles(
    UserRole.SUPERUSER,
    UserRole.REGIONAL_MANAGER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.DOCTOR,
    UserRole.AMBULANCE,
    UserRole.PATIENT,
  )
  @Get('scope')
  @ApiOperation({ summary: 'What the caller is allowed to see, and how much of it there is' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async myScope(@Req() req: any) {
    return this.hierarchyService.getMyScope(req.user);
  }
}
