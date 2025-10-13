import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadSource, LeadStatus, LeadPriority } from './lead.entity';
import { User, UserRole } from '../users/user.entity';
import { LeadAutomationService } from './lead-automation.service';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

export interface LeadImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  importedLeads: Lead[];
}

@Injectable()
export class LeadsImportService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private leadAutomationService: LeadAutomationService,
  ) {}

  async importLeadsFromCSV(csvBuffer: Buffer, importedBy: string): Promise<LeadImportResult> {
    const result: LeadImportResult = {
      totalRows: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      importedLeads: [],
    };

    try {
      // Get all active sales agents for assignment
      const salesAgents = await this.userRepository.find({
        where: { 
          role: UserRole.SALES_PERSON,
          isActive: true 
        },
        order: { workloadScore: 'ASC' }
      });

      if (salesAgents.length === 0) {
        throw new BadRequestException('No active sales agents found for lead assignment');
      }

      const leads: any[] = [];
      const stream = Readable.from(csvBuffer.toString());

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => {
            leads.push(row);
            result.totalRows++;
          })
          .on('end', resolve)
          .on('error', reject);
      });

      console.log(`📊 Processing ${leads.length} leads from CSV`);

      // Process each lead
      for (let i = 0; i < leads.length; i++) {
        const row = leads[i];
        const rowNumber = i + 1;

        try {
          // Validate required fields
          if (!row.fullName || (!row.email && !row.phone)) {
            result.errors.push(`Row ${rowNumber}: Missing required fields (fullName and either email or phone)`);
            result.failedImports++;
            continue;
          }

          // Validate email format if provided
          if (row.email && !this.isValidEmail(row.email)) {
            result.errors.push(`Row ${rowNumber}: Invalid email format - ${row.email}`);
            result.failedImports++;
            continue;
          }

          // Validate phone format if provided
          if (row.phone && !this.isValidPhone(row.phone)) {
            result.errors.push(`Row ${rowNumber}: Invalid phone format - ${row.phone}`);
            result.failedImports++;
            continue;
          }

          // Check for duplicate email
          if (row.email) {
            const existingLead = await this.leadRepository.findOne({
              where: { email: row.email }
            });
            if (existingLead) {
              result.errors.push(`Row ${rowNumber}: Lead with email ${row.email} already exists`);
              result.failedImports++;
              continue;
            }
          }

          // Check for duplicate phone
          if (row.phone) {
            const existingLead = await this.leadRepository.findOne({
              where: { phone: row.phone }
            });
            if (existingLead) {
              result.errors.push(`Row ${rowNumber}: Lead with phone ${row.phone} already exists`);
              result.failedImports++;
              continue;
            }
          }

          // Map source
          const source = this.mapSource(row.source);
          if (!source) {
            result.errors.push(`Row ${rowNumber}: Invalid source - ${row.source}`);
            result.failedImports++;
            continue;
          }

          // Create lead
          const lead = this.leadRepository.create({
            fullName: row.fullName.trim(),
            email: row.email ? row.email.trim().toLowerCase() : null,
            phone: row.phone ? row.phone.trim() : null,
            source: source,
            sourceDetails: row.sourceDetails ? row.sourceDetails.trim() : null,
            status: LeadStatus.NEW,
            priority: this.mapPriority(row.budgetRange),
            initialNotes: row.initialNotes ? row.initialNotes.trim() : null,
            interests: row.interests ? row.interests.trim() : null,
            budgetRange: row.budgetRange ? parseFloat(row.budgetRange) : null,
            preferredContactMethod: row.preferredContactMethod ? row.preferredContactMethod.trim() : null,
            preferredContactTime: row.preferredContactTime ? row.preferredContactTime.trim() : null,
            generatedByUserId: importedBy,
          });

          // Auto-assign to sales agent
          const assignedAgent = this.selectSalesAgent(salesAgents, lead);
          if (assignedAgent) {
            lead.assignedToUserId = assignedAgent.id;
            
            // Update agent workload
            await this.userRepository.update(assignedAgent.id, {
              workloadScore: assignedAgent.workloadScore + 1
            });
          }

          // Save lead
          const savedLead = await this.leadRepository.save(lead);
          result.importedLeads.push(savedLead);
          result.successfulImports++;

          console.log(`✅ Imported lead: ${savedLead.fullName} -> ${assignedAgent?.fullName || 'Unassigned'}`);

        } catch (error) {
          result.errors.push(`Row ${rowNumber}: ${error.message}`);
          result.failedImports++;
          console.error(`❌ Error importing row ${rowNumber}:`, error.message);
        }
      }

      console.log(`📊 Import Complete: ${result.successfulImports} successful, ${result.failedImports} failed`);

    } catch (error) {
      result.errors.push(`Import failed: ${error.message}`);
      console.error('❌ CSV import error:', error);
    }

    return result;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Pakistani phone number format: +92-XXX-XXXXXXX
    const phoneRegex = /^\+92-\d{3}-\d{7}$/;
    return phoneRegex.test(phone);
  }

  private mapSource(source: string): LeadSource | null {
    const sourceMap: { [key: string]: LeadSource } = {
      'website': LeadSource.WEBSITE,
      'walk-in': LeadSource.WALK_IN,
      'walk_in': LeadSource.WALK_IN,
      'referral': LeadSource.REFERRAL,
      'social-media': LeadSource.FACEBOOK_ADS,
      'social_media': LeadSource.FACEBOOK_ADS,
      'advertisement': LeadSource.GOOGLE_ADS,
      'phone_call': LeadSource.PHONE_CALL,
      'phone-call': LeadSource.PHONE_CALL,
      'other': LeadSource.OTHER,
    };

    return sourceMap[source?.toLowerCase()] || null;
  }

  private mapPriority(budgetRange: string): LeadPriority {
    if (!budgetRange) return LeadPriority.MEDIUM;
    
    const budget = parseFloat(budgetRange);
    if (budget >= 15000000) return LeadPriority.HIGH;
    if (budget >= 5000000) return LeadPriority.MEDIUM;
    return LeadPriority.LOW;
  }

  private selectSalesAgent(salesAgents: User[], lead: Lead): User | null {
    if (salesAgents.length === 0) return null;

    // Simple round-robin assignment based on current workload
    // In a real system, this could be more sophisticated
    const sortedAgents = salesAgents.sort((a, b) => a.workloadScore - b.workloadScore);
    return sortedAgents[0];
  }
}
