import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { SalesActivity } from './sales-activity.entity';
import { CreateTeamMemberDto, UpdateTeamMemberDto, AssignLeadDto } from './dto/sales-team.dto';

@Injectable()
export class SalesTeamService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(SalesActivity)
    private salesActivityRepository: Repository<SalesActivity>,
  ) {}

  /**
   * Get all team members managed by a sales manager
   */
  async getTeamMembers(managerId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: [
        'id', 'fullName', 'email', 'phone', 'department', 
        'employeeId', 'workloadScore', 'createdAt', 'isActive'
      ],
      order: { fullName: 'ASC' }
    });
  }

  /**
   * Create a new team member
   */
  async createTeamMember(managerId: string, createDto: CreateTeamMemberDto): Promise<User> {
    // Verify manager exists and is a sales manager
    const manager = await this.userRepository.findOne({
      where: { 
        id: managerId,
        role: UserRole.SALES_MANAGER,
        isActive: true
      }
    });

    if (!manager) {
      throw new NotFoundException('Sales manager not found');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const teamMember = this.userRepository.create({
      ...createDto,
      role: UserRole.SALES_PERSON,
      assignedToUserId: managerId,
      department: createDto.department || 'Sales',
      workloadScore: 0,
      isActive: true
    });

    return await this.userRepository.save(teamMember);
  }

  /**
   * Update team member information
   */
  async updateTeamMember(
    managerId: string, 
    memberId: string, 
    updateDto: UpdateTeamMemberDto
  ): Promise<User> {
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: memberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    Object.assign(teamMember, updateDto);
    return await this.userRepository.save(teamMember);
  }

  /**
   * Remove team member (soft delete)
   */
  async removeTeamMember(managerId: string, memberId: string): Promise<void> {
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: memberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    teamMember.isActive = false;
    await this.userRepository.save(teamMember);
  }

  /**
   * Get team member workload for lead assignment
   */
  async getTeamWorkload(managerId: string): Promise<{ userId: string; fullName: string; workloadScore: number }[]> {
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName', 'workloadScore']
    });

    return teamMembers.map(member => ({
      userId: member.id,
      fullName: member.fullName,
      workloadScore: member.workloadScore
    }));
  }

  /**
   * Update team member workload score
   */
  async updateWorkloadScore(memberId: string, score: number): Promise<void> {
    await this.userRepository.update(
      { id: memberId, role: UserRole.SALES_PERSON },
      { workloadScore: score }
    );
  }

  /**
   * Get next available team member for lead assignment
   */
  async getNextAvailableTeamMember(managerId: string): Promise<string | null> {
    const teamMembers = await this.getTeamWorkload(managerId);
    
    if (teamMembers.length === 0) {
      return null;
    }

    // Sort by workload score (ascending) and return the one with lowest workload
    const sortedMembers = teamMembers.sort((a, b) => a.workloadScore - b.workloadScore);
    return sortedMembers[0].userId;
  }

  /**
   * Assign lead to team member
   */
  async assignLeadToTeamMember(managerId: string, assignDto: AssignLeadDto): Promise<void> {
    // Verify team member belongs to this manager
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: assignDto.teamMemberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Update workload score
    await this.updateWorkloadScore(assignDto.teamMemberId, teamMember.workloadScore + 1);
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(managerId: string, startDate?: Date, endDate?: Date) {
    const teamMembers = await this.getTeamMembers(managerId);
    const teamMemberIds = teamMembers.map(member => member.id);
    
    if (teamMemberIds.length === 0) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        averageWorkload: 0,
        averageConversionRate: 0,
        totalRevenue: 0,
        topPerformer: '',
        teamGoal: 1000000,
        goalProgress: 0,
        monthlyTarget: 500000,
        monthlyProgress: 0,
        members: []
      };
    }

    // Get performance data for each team member
    const performanceData = await Promise.all(
      teamMembers.map(async (member) => {
        const [leadsCount, convertedLeads, bookingsCount, totalSales, activitiesCount] = await Promise.all([
          this.leadRepository.count({ where: { assignedToUserId: member.id } }),
          this.leadRepository.count({ where: { assignedToUserId: member.id, status: LeadStatus.CONVERTED } }),
          this.bookingRepository.count({ where: { createdById: member.id } }),
          this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(booking.totalAmount)', 'total')
            .where('booking.createdById = :memberId', { memberId: member.id })
            .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
            .getRawOne(),
          this.salesActivityRepository.count({ where: { userId: member.id } })
        ]);

        const conversionRate = leadsCount > 0 ? (convertedLeads / leadsCount) * 100 : 0;
        const averageDealSize = bookingsCount > 0 ? (parseFloat(totalSales.total) || 0) / bookingsCount : 0;

        return {
          id: member.id,
          name: member.fullName,
          email: member.email,
          role: 'Sales Agent',
          workloadScore: member.workloadScore,
          totalLeads: leadsCount,
          convertedLeads,
          conversionRate,
          totalBookings: bookingsCount,
          totalRevenue: parseFloat(totalSales.total) || 0,
          averageDealSize,
          activitiesCount,
          lastActivity: new Date().toISOString(),
          performanceScore: conversionRate
        };
      })
    );

    // Calculate team metrics
    const totalMembers = performanceData.length;
    const activeMembers = performanceData.filter(m => m.totalLeads > 0).length;
    const averageWorkload = totalMembers > 0 ? performanceData.reduce((sum, m) => sum + m.workloadScore, 0) / totalMembers : 0;
    const averageConversionRate = totalMembers > 0 ? performanceData.reduce((sum, m) => sum + m.conversionRate, 0) / totalMembers : 0;
    const totalRevenue = performanceData.reduce((sum, m) => sum + m.totalRevenue, 0);
    const topPerformer = performanceData.length > 0 
      ? performanceData.reduce((top, member) => member.conversionRate > top.conversionRate ? member : top).name
      : '';

    return {
      totalMembers,
      activeMembers,
      averageWorkload,
      averageConversionRate,
      totalRevenue,
      topPerformer,
      teamGoal: 1000000,
      goalProgress: (totalRevenue / 1000000) * 100,
      monthlyTarget: 500000,
      monthlyProgress: (totalRevenue / 500000) * 100,
      members: performanceData
    };
  }
}
