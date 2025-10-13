import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Request,
  BadRequestException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { LeadsImportService } from './leads-import.service';
import { multerConfig } from '../config/multer.config';

@Controller('leads/import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsImportController {
  constructor(private leadsImportService: LeadsImportService) {}

  @Post('csv')
  @RequirePermissions(Permission.CREATE_LEADS)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async importLeadsFromCSV(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      if (!file.originalname.endsWith('.csv')) {
        throw new BadRequestException('Only CSV files are allowed');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new BadRequestException('File size too large. Maximum 5MB allowed');
      }

      console.log(`📁 Processing CSV file: ${file.originalname} (${file.size} bytes)`);

      // Import leads
      const result = await this.leadsImportService.importLeadsFromCSV(
        file.buffer,
        req.user.userId
      );

      console.log(`📊 Import Result: ${result.successfulImports}/${result.totalRows} successful`);

      return {
        success: true,
        message: `Successfully imported ${result.successfulImports} out of ${result.totalRows} leads`,
        data: {
          totalRows: result.totalRows,
          successfulImports: result.successfulImports,
          failedImports: result.failedImports,
          errors: result.errors,
          importedLeads: result.importedLeads.map(lead => ({
            id: lead.id,
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
            priority: lead.priority,
            assignedToUserId: lead.assignedToUserId,
            createdAt: lead.createdAt
          }))
        }
      };

    } catch (error) {
      console.error('❌ CSV import error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Import failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('validate')
  @RequirePermissions(Permission.CREATE_LEADS)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async validateCSV(
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      if (!file.originalname.endsWith('.csv')) {
        throw new BadRequestException('Only CSV files are allowed');
      }

      // Basic validation without importing
      const csvContent = file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new BadRequestException('CSV file must have at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['fullname', 'email', 'phone', 'source'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      return {
        success: true,
        message: 'CSV file is valid',
        data: {
          totalRows: lines.length - 1,
          headers: headers,
          fileSize: file.size
        }
      };

    } catch (error) {
      console.error('❌ CSV validation error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
