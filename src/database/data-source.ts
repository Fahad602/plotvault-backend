import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Plot } from '../plots/plot.entity';
import { PlotSizePricing } from '../plots/plot-size-pricing.entity';
import { PlotOwnershipHistory } from '../plots/plot-ownership-history.entity';
import { Booking } from '../bookings/booking.entity';
import { Installment } from '../finance/installment.entity';
import { PaymentSchedule } from '../finance/payment-schedule.entity';
import { Payment } from '../finance/payment.entity';
import { PaymentPlan } from '../finance/payment-plan.entity';
import { PaymentProof } from '../finance/payment-proof.entity';
import { Expense } from '../finance/expense.entity';
import { Account, JournalEntry, JournalLine } from '../finance/entities';
import { ActivityLog } from '../common/activity-log.entity';
import { Document } from '../documents/document.entity';
import { CustomerInteraction } from '../crm/customer-interaction.entity';
import { Notification } from '../communication/notification.entity';
import { Message } from '../communication/message.entity';
import { MessageAttachment } from '../communication/message.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { ConstructionProject } from '../construction/construction-project.entity';
import { ConstructionPhase } from '../construction/construction-phase.entity';
import { ConstructionTask } from '../construction/construction-task.entity';
import { ConstructionExpense } from '../construction/construction-expense.entity';
import { ConstructionDocument } from '../construction/construction-document.entity';
import { Lead } from '../leads/lead.entity';
import { LeadCommunication } from '../leads/lead-communication.entity';
import { LeadNote } from '../leads/lead-note.entity';
import { SalesActivity } from '../users/sales-activity.entity';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: configService.get('DATABASE_URL') || 'queen-hills.db',
  entities: [
    User, 
    Customer, 
    Plot, 
    PlotSizePricing,
    PlotOwnershipHistory,
    Booking, 
    Installment, 
    PaymentSchedule,
    Payment,
    PaymentPlan,
    PaymentProof,
    Expense,
    Account,
    JournalEntry,
    JournalLine,
    ActivityLog, 
    Document,
    CustomerInteraction,
    Notification,
    Message,
    MessageAttachment,
    AuditLog,
    ConstructionProject,
    ConstructionPhase,
    ConstructionTask,
    ConstructionExpense,
    ConstructionDocument,
    Lead,
    LeadCommunication,
    LeadNote,
    SalesActivity
  ],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false, // Disable synchronize for migrations
  logging: configService.get('NODE_ENV') === 'development',
}); 