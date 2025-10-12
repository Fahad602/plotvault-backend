import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installment } from './installment.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { Payment } from './payment.entity';
import { PaymentPlan } from './payment-plan.entity';
import { PaymentProof } from './payment-proof.entity';
import { Account, JournalEntry, JournalLine } from './entities';
import { FinanceController } from './finance.controller';
import { PaymentScheduleController } from './payment-schedule.controller';
import { PaymentController } from './payment.controller';
import { PaymentPlanController } from './payment-plan.controller';
import { BookingPaymentController } from './booking-payment.controller';
import { FinanceService } from './finance.service';
import { PaymentScheduleService } from './payment-schedule.service';
import { PaymentService } from './payment.service';
import { PaymentPlanService } from './payment-plan.service';
import { BookingPaymentService } from './booking-payment.service';
import { EnhancedPaymentScheduleService } from './enhanced-payment-schedule.service';
import { Booking } from '../bookings/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Installment, 
    PaymentSchedule, 
    Payment, 
    PaymentPlan, 
    PaymentProof, 
    Booking,
    Account, 
    JournalEntry, 
    JournalLine
  ])],
  providers: [
    FinanceService, 
    PaymentScheduleService, 
    PaymentService, 
    PaymentPlanService, 
    BookingPaymentService,
    EnhancedPaymentScheduleService
  ],
  controllers: [
    FinanceController, 
    PaymentScheduleController, 
    PaymentController, 
    PaymentPlanController, 
    BookingPaymentController
  ],
  exports: [
    FinanceService, 
    PaymentScheduleService, 
    PaymentService, 
    PaymentPlanService, 
    BookingPaymentService,
    EnhancedPaymentScheduleService
  ],
})
export class FinanceModule {} 