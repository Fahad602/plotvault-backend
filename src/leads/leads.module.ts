import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './lead.entity';
import { LeadCommunication } from './lead-communication.entity';
import { LeadNote } from './lead-note.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadAutomationService } from './lead-automation.service';
import { LeadWebhooksController } from './webhooks/lead-webhooks.controller';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { SalesActivity } from '../users/sales-activity.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      LeadCommunication,
      LeadNote,
      Customer,
      User,
      SalesActivity,
    ]),
    UsersModule,
  ],
  controllers: [LeadsController, LeadWebhooksController],
  providers: [LeadsService, LeadAutomationService],
  exports: [LeadsService, LeadAutomationService],
})
export class LeadsModule {}
