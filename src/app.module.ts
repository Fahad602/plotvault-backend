import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlotsModule } from './plots/plots.module';
import { BookingsModule } from './bookings/bookings.module';
import { CustomersModule } from './customers/customers.module';
import { FinanceModule } from './finance/finance.module';
import { MarketingModule } from './marketing/marketing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { CrmModule } from './crm/crm.module';
import { ConstructionModule } from './construction/construction.module';
import { DocumentModule } from './documents/document.module';
import { CommunicationModule } from './communication/communication.module';
import { LeadsModule } from './leads/leads.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      migrationsRun: process.env.NODE_ENV === 'production',
    } as TypeOrmModuleOptions),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    PlotsModule,
    BookingsModule,
    CustomersModule,
    FinanceModule,
    MarketingModule,
    DashboardModule,
    HealthModule,
    AuditModule,
    CrmModule,
    ConstructionModule,
    DocumentModule,
    CommunicationModule,
    LeadsModule,
    AnalyticsModule,
  ],
})
export class AppModule {} 