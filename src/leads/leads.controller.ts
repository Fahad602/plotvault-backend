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
  DefaultValuePipe,
  Request
} from '@nestjs/common';
import { LeadsService, CreateLeadDto, UpdateLeadDto, CreateCommunicationDto, CreateNoteDto, LeadFilters } from './leads.service';
import { LeadWorkflowService } from './lead-workflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { LeadStatus, LeadSource, LeadPriority } from './lead.entity';

@Controller('leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadWorkflowService: LeadWorkflowService,
  ) {}

  @Post()
  @RequirePermissions(Permission.CREATE_LEADS)
  async createLead(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    // Auto-assign to current user if they are a sales agent and no assignment is specified
    if (req.user.role === 'sales_person' && !createLeadDto.assignedToUserId) {
      createLeadDto.assignedToUserId = req.user.userId;
    }
    
    return await this.leadsService.createLead(createLeadDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_LEADS)
  async getAllLeads(
    @Request() req,
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
      userId: req.user.userId,
      role: req.user.role
    });
  }

  @Get('stats')
  @RequirePermissions(Permission.VIEW_LEAD_ANALYTICS)
  async getLeadStats(
    @Request() req,
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

    return await this.leadsService.getLeadStats(filters, {
      userId: req.user.userId,
      role: req.user.role
    });
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
    @Request() req,
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
      assignedToUserId: req.user.userId,
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
    @Request() req,
  ) {
    return await this.leadsService.convertLeadToCustomer(id, customerData, req.user.userId);
  }

  // Communication endpoints
  @Post(':id/communications')
  @RequirePermissions(Permission.EDIT_LEADS)
  async addCommunication(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Body() createCommunicationDto: Omit<CreateCommunicationDto, 'leadId' | 'userId'>,
    @Request() req,
  ) {
    return await this.leadsService.addCommunication({
      ...createCommunicationDto,
      leadId,
      userId: req.user.userId,
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
    @Request() req,
  ) {
    return await this.leadsService.addNote({
      ...createNoteDto,
      leadId,
      userId: req.user.userId,
    });
  }

  @Get(':id/notes')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadNotes(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Request() req,
  ) {
    return await this.leadsService.getLeadNotes(leadId, req.user.userId);
  }

  // Workflow endpoints
  @Post('workflow/process')
  @RequirePermissions(Permission.VIEW_LEADS)
  async processWorkflow(@Request() req) {
    console.log('Manual workflow processing triggered by:', req.user.email);
    await this.leadWorkflowService.processWorkflowAutomation();
    return { message: 'Workflow automation completed successfully' };
  }

  @Get('workflow/stats')
  @RequirePermissions(Permission.VIEW_LEAD_ANALYTICS)
  async getWorkflowStats(@Request() req) {
    return await this.leadWorkflowService.getWorkflowStats();
  }
}
