import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Lead, LeadStatus, LeadSource, LeadPriority } from './lead.entity';
import { LeadCommunication, CommunicationType, CommunicationDirection, CommunicationOutcome } from './lead-communication.entity';
import { LeadNote, NoteType } from './lead-note.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';

export interface CreateLeadDto {
  fullName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  sourceDetails?: string;
  priority?: LeadPriority;
  initialNotes?: string;
  interests?: string;
  budgetRange?: number;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  generatedByUserId?: string;
  assignedToUserId?: string;
  tags?: string[];
}

export interface UpdateLeadDto {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  interests?: string;
  budgetRange?: number;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  assignedToUserId?: string;
  nextFollowUpAt?: Date;
  tags?: string[];
}

export interface CreateCommunicationDto {
  leadId: string;
  userId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  outcome?: CommunicationOutcome;
  subject: string;
  description: string;
  duration?: number;
  scheduledAt?: Date;
  completedAt?: Date;
  nextFollowUpAt?: Date;
  attachments?: string[];
  isImportant?: boolean;
}

export interface CreateNoteDto {
  leadId: string;
  userId: string;
  type?: NoteType;
  title: string;
  content: string;
  isImportant?: boolean;
  isPrivate?: boolean;
  tags?: string[];
  reminderAt?: Date;
}

export interface LeadFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assignedToUserId?: string;
  generatedByUserId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastContactedAfter?: Date;
  lastContactedBefore?: Date;
  search?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(LeadCommunication)
    private communicationRepository: Repository<LeadCommunication>,
    @InjectRepository(LeadNote)
    private noteRepository: Repository<LeadNote>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createLead(createLeadDto: CreateLeadDto): Promise<Lead> {
    // Validate that at least email or phone is provided
    if (!createLeadDto.email && !createLeadDto.phone) {
      throw new BadRequestException('Either email or phone number must be provided');
    }

    // Validate assigned user exists and is a sales agent
    if (createLeadDto.assignedToUserId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: createLeadDto.assignedToUserId }
      });
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    const lead = this.leadRepository.create({
      ...createLeadDto,
      assignedToUserId: createLeadDto.assignedToUserId || null,
      generatedByUserId: createLeadDto.generatedByUserId || null,
      tags: createLeadDto.tags ? JSON.stringify(createLeadDto.tags) : null,
    });

    return await this.leadRepository.save(lead);
  }

  async getAllLeads(
    filters: LeadFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    currentUser?: { userId: string; role: string }
  ) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedToUser', 'assignedUser')
      .leftJoinAndSelect('lead.generatedByUser', 'generatedUser')
      .leftJoinAndSelect('lead.convertedByUser', 'convertedUser')
      .leftJoinAndSelect('lead.convertedToCustomer', 'customer');

    this.applyFilters(queryBuilder, filters);

    // Apply role-based filtering
    if (currentUser) {
      if (currentUser.role === 'sales_person') {
        // Sales team members can only see leads assigned to them
        queryBuilder.andWhere('lead.assignedToUserId = :userId', { userId: currentUser.userId });
      }
      // Sales managers and admins can see all leads (no additional filtering)
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(lead.fullName LIKE :search OR lead.email LIKE :search OR lead.phone LIKE :search OR lead.sourceDetails LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const skip = (page - 1) * limit;
    const [leads, total] = await queryBuilder
      .orderBy(`lead.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Parse tags for each lead
    const leadsWithParsedTags = leads.map(lead => ({
      ...lead,
      tags: lead.tags ? JSON.parse(lead.tags) : [],
    }));

    return {
      data: leadsWithParsedTags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Lead>, filters: LeadFilters) {
    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('lead.status IN (:...status)', { status: filters.status });
    }

    if (filters.source && filters.source.length > 0) {
      queryBuilder.andWhere('lead.source IN (:...source)', { source: filters.source });
    }

    if (filters.priority && filters.priority.length > 0) {
      queryBuilder.andWhere('lead.priority IN (:...priority)', { priority: filters.priority });
    }

    if (filters.assignedToUserId) {
      queryBuilder.andWhere('lead.assignedToUserId = :assignedToUserId', { 
        assignedToUserId: filters.assignedToUserId 
      });
    }

    if (filters.generatedByUserId) {
      queryBuilder.andWhere('lead.generatedByUserId = :generatedByUserId', { 
        generatedByUserId: filters.generatedByUserId 
      });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('lead.createdAt >= :createdAfter', { createdAfter: filters.createdAfter });
    }

    if (filters.createdBefore) {
      queryBuilder.andWhere('lead.createdAt <= :createdBefore', { createdBefore: filters.createdBefore });
    }

    if (filters.lastContactedAfter) {
      queryBuilder.andWhere('lead.lastContactedAt >= :lastContactedAfter', { 
        lastContactedAfter: filters.lastContactedAfter 
      });
    }

    if (filters.lastContactedBefore) {
      queryBuilder.andWhere('lead.lastContactedAt <= :lastContactedBefore', { 
        lastContactedBefore: filters.lastContactedBefore 
      });
    }
  }

  async getLeadById(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: [
        'assignedToUser',
        'generatedByUser',
        'convertedByUser',
        'convertedToCustomer',
        'communications',
        'communications.user',
        'notes',
        'notes.user'
      ],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return {
      ...lead,
      tags: lead.tags ? JSON.parse(lead.tags) : [],
    };
  }

  async updateLead(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.getLeadById(id);

    // Validate assigned user if provided
    if (updateLeadDto.assignedToUserId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: updateLeadDto.assignedToUserId }
      });
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    Object.assign(lead, {
      ...updateLeadDto,
      assignedToUserId: updateLeadDto.assignedToUserId || null,
      tags: updateLeadDto.tags ? JSON.stringify(updateLeadDto.tags) : lead.tags,
    });

    return await this.leadRepository.save(lead);
  }

  async deleteLead(id: string): Promise<void> {
    const lead = await this.getLeadById(id);
    await this.leadRepository.remove(lead);
  }

  async convertLeadToCustomer(
    leadId: string,
    customerData: {
      cnic: string;
      address: string;
    },
    convertedByUserId: string
  ): Promise<{ lead: Lead; customer: Customer }> {
    const lead = await this.getLeadById(leadId);
    
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead is already converted');
    }

    // Create customer from lead data
    const customer = this.customerRepository.create({
      cnic: customerData.cnic,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      address: customerData.address,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Update lead status
    lead.status = LeadStatus.CONVERTED;
    lead.convertedToCustomerId = savedCustomer.id;
    lead.convertedByUserId = convertedByUserId;
    lead.convertedAt = new Date();

    const updatedLead = await this.leadRepository.save(lead);

    return { lead: updatedLead, customer: savedCustomer };
  }

  // Communication methods
  async addCommunication(createCommunicationDto: CreateCommunicationDto): Promise<LeadCommunication> {
    const lead = await this.getLeadById(createCommunicationDto.leadId);
    
    const communication = this.communicationRepository.create({
      ...createCommunicationDto,
      attachments: createCommunicationDto.attachments ? JSON.stringify(createCommunicationDto.attachments) : null,
    });

    const savedCommunication = await this.communicationRepository.save(communication);

    // Update lead's last contacted date
    lead.lastContactedAt = new Date();
    if (createCommunicationDto.nextFollowUpAt) {
      lead.nextFollowUpAt = createCommunicationDto.nextFollowUpAt;
    }
    await this.leadRepository.save(lead);

    return savedCommunication;
  }

  async getLeadCommunications(leadId: string): Promise<LeadCommunication[]> {
    return await this.communicationRepository.find({
      where: { leadId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Note methods
  async addNote(createNoteDto: CreateNoteDto): Promise<LeadNote> {
    await this.getLeadById(createNoteDto.leadId); // Validate lead exists

    const note = this.noteRepository.create({
      ...createNoteDto,
      tags: createNoteDto.tags ? JSON.stringify(createNoteDto.tags) : null,
    });

    return await this.noteRepository.save(note);
  }

  async getLeadNotes(leadId: string, userId?: string): Promise<LeadNote[]> {
    const queryBuilder = this.noteRepository.createQueryBuilder('note')
      .leftJoinAndSelect('note.user', 'user')
      .where('note.leadId = :leadId', { leadId })
      .orderBy('note.createdAt', 'DESC');

    // If userId is provided, filter private notes
    if (userId) {
      queryBuilder.andWhere('(note.isPrivate = false OR note.userId = :userId)', { userId });
    } else {
      queryBuilder.andWhere('note.isPrivate = false');
    }

    return await queryBuilder.getMany();
  }

  // Analytics methods
  async getLeadStats(filters: LeadFilters = {}) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');
    this.applyFilters(queryBuilder, filters);

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.NEW }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.CONTACTED }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.QUALIFIED }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.CONVERTED }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.LOST }).getCount(),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  }

  async getLeadsBySource(filters: LeadFilters = {}) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');
    this.applyFilters(queryBuilder, filters);

    const results = await queryBuilder
      .select('lead.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.source')
      .getRawMany();

    return results.map(result => ({
      source: result.source,
      count: parseInt(result.count),
    }));
  }
}
