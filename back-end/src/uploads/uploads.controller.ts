import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Uploads Controller
 * Stores and serves documents attached to patients, hospitals and users —
 * ID proofs, scanned reports, registration certificates.
 *
 * The upload route is guarded by three layers of middleware:
 *  FileUploadMiddleware (router-level, early rejection)
 *   -> multer via FileInterceptor (writes the file, enforces size + MIME)
 *   -> AuthGuard / RolesGuard (who is allowed to upload)
 */
@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Roles(
  UserRole.SUPERUSER,
  UserRole.ADMINISTRATIVE_STAFF,
  UserRole.DOCTOR,
  UserRole.HOSPITAL_MANAGER,
  UserRole.REGIONAL_MANAGER,
)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload a document
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document and attach it to a record' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string', example: 'patient', enum: ['patient', 'hospital', 'user', 'bed', 'general'] },
        entityId: { type: 'string', example: 'P001' },
        description: { type: 'string', example: 'Discharge summary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing file, unsupported type, or not multipart' })
  @ApiResponse({ status: 413, description: 'File exceeds the size limit' })
  async upload(
    @UploadedFile() file: any,
    @Body() body: { entityType?: string; entityId?: string; description?: string },
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file received. Send the file in a "file" field.');
    }

    return this.uploadsService.create(file, {
      entityType: body.entityType,
      entityId: body.entityId,
      description: body.description,
      uploadedBy: req.user?.id ?? 'unknown',
    });
  }

  /**
   * List uploads, optionally filtered by the record they belong to
   */
  @Get()
  @ApiOperation({ summary: 'List uploaded documents' })
  @ApiQuery({ name: 'entityType', required: false, example: 'patient' })
  @ApiQuery({ name: 'entityId', required: false, example: 'P001' })
  @ApiResponse({ status: 200, description: 'List of uploads' })
  async findAll(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.uploadsService.findAll({ entityType, entityId });
  }

  /**
   * Download a stored file
   */
  @Get(':id/download')
  @ApiOperation({ summary: 'Download an uploaded document' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const stored = this.uploadsService.getStoredFile(id);
    if (!stored) {
      throw new NotFoundException(`File with ID '${id}' not found`);
    }

    res.setHeader('Content-Type', stored.record.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(stored.record.originalName)}"`);
    res.sendFile(stored.absolutePath);
  }

  /**
   * Metadata for a single upload
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get upload metadata' })
  @ApiResponse({ status: 200, description: 'Upload metadata' })
  async findById(@Param('id') id: string) {
    return this.uploadsService.findById(id);
  }

  /**
   * Delete an upload and the file behind it
   */
  @Delete(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({ summary: 'Delete an uploaded document' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.uploadsService.remove(id, req.user?.id ?? 'unknown');
  }
}
