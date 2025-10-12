import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe 
} from '@nestjs/common';
import { LeadsService, CreateLeadDto, UpdateLeadDto, CreateCommunicationDto, CreateNoteDto, LeadFilters } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { LeadStatus, LeadSource, LeadPriority } from './lead.entity';

@Controller('leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_LEADS)
  async createLead(@Body() createLeadDto: CreateLeadDto) {
    return await this.leadsService.createLead(createLeadDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_LEADS)
  async getAllLeads(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('generatedByUserId') generatedByUserId?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC' = 'DESC',
    @GetUser() user?: User,
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      source: source ? source.split(',') as LeadSource[] : undefined,
      priority: priority ? priority.split(',') as LeadPriority[] : undefined,
      assignedToUserId,
      generatedByUserId,
      search,
    };

    return await this.leadsService.getAllLeads(filters, page, limit, sortBy, sortOrder, {
      userId: user.id,
      role: user.role
    });
  }

  @Get('stats')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  async getLeadStats(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('generatedByUserId') generatedByUserId?: string,
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      source: source ? source.split(',') as LeadSource[] : undefined,
      priority: priority ? priority.split(',') as LeadPriority[] : undefined,
      assignedToUserId,
      generatedByUserId,
    };

    return await this.leadsService.getLeadStats(filters);
  }

  @Get('by-source')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  async getLeadsBySource(
    @Query('status') status?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('generatedByUserId') generatedByUserId?: string,
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      assignedToUserId,
      generatedByUserId,
    };

    return await this.leadsService.getLeadsBySource(filters);
  }

  @Get('my-leads')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getMyLeads(
    @GetUser() user: User,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      source: source ? source.split(',') as LeadSource[] : undefined,
      priority: priority ? priority.split(',') as LeadPriority[] : undefined,
      assignedToUserId: user.id,
      search,
    };

    return await this.leadsService.getAllLeads(filters, page, limit, sortBy, sortOrder);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.leadsService.getLeadById(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.EDIT_LEADS)
  async updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return await this.leadsService.updateLead(id, updateLeadDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_LEADS)
  async deleteLead(@Param('id', ParseUUIDPipe) id: string) {
    await this.leadsService.deleteLead(id);
    return { message: 'Lead deleted successfully' };
  }

  @Post(':id/convert')
  @RequirePermissions(Permission.CONVERT_LEADS)
  async convertLeadToCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() customerData: { cnic: string; address: string },
    @GetUser() user: User,
  ) {
    return await this.leadsService.convertLeadToCustomer(id, customerData, user.id);
  }

  // Communication endpoints
  @Post(':id/communications')
  @RequirePermissions(Permission.EDIT_LEADS)
  async addCommunication(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Body() createCommunicationDto: Omit<CreateCommunicationDto, 'leadId' | 'userId'>,
    @GetUser() user: User,
  ) {
    return await this.leadsService.addCommunication({
      ...createCommunicationDto,
      leadId,
      userId: user.id,
    });
  }

  @Get(':id/communications')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadCommunications(@Param('id', ParseUUIDPipe) leadId: string) {
    return await this.leadsService.getLeadCommunications(leadId);
  }

  // Note endpoints
  @Post(':id/notes')
  @RequirePermissions(Permission.EDIT_LEADS)
  async addNote(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Body() createNoteDto: Omit<CreateNoteDto, 'leadId' | 'userId'>,
    @GetUser() user: User,
  ) {
    return await this.leadsService.addNote({
      ...createNoteDto,
      leadId,
      userId: user.id,
    });
  }

  @Get(':id/notes')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadNotes(
    @Param('id', ParseUUIDPipe) leadId: string,
    @GetUser() user: User,
  ) {
    return await this.leadsService.getLeadNotes(leadId, user.id);
  }
}
