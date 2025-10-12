import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { SalesManagerDashboardController } from './sales-manager-dashboard.controller';
import { SalesManagerDashboardService } from './sales-manager-dashboard.service';
import { Plot } from '../plots/plot.entity';
import { Customer } from '../customers/customer.entity';
import { Booking } from '../bookings/booking.entity';
import { Installment } from '../finance/installment.entity';
import { ConstructionProject } from '../construction/construction-project.entity';
import { Document } from '../documents/document.entity';
import { Message } from '../communication/message.entity';
import { User } from '../users/user.entity';
import { Lead } from '../leads/lead.entity';
import { Payment } from '../finance/payment.entity';
import { SalesActivity } from '../users/sales-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Plot, 
    Customer, 
    Booking, 
    Installment, 
    ConstructionProject, 
    Document, 
    Message,
    User,
    Lead,
    Payment,
    SalesActivity
  ])],
  providers: [SalesManagerDashboardService],
  controllers: [DashboardController, SalesManagerDashboardController],
  exports: [SalesManagerDashboardService],
})
export class DashboardModule {} 