import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostgreSQLSchema1735691000000 implements MigrationInterface {
    name = 'CreatePostgreSQLSchema1735691000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This migration is PostgreSQL-specific, skip for SQLite
        const dbType = queryRunner.connection.options.type;
        if (dbType !== 'postgres') {
            console.log('Skipping PostgreSQL-specific migration for', dbType);
            return;
        }

        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "passwordHash" character varying NOT NULL,
                "fullName" character varying NOT NULL,
                "role" character varying NOT NULL DEFAULT 'buyer',
                "isActive" boolean NOT NULL DEFAULT true,
                "assignedToUserId" character varying,
                "department" character varying,
                "employeeId" character varying,
                "phone" character varying,
                "address" character varying,
                "workloadScore" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

        // Create plots table
        await queryRunner.query(`
            CREATE TABLE "plots" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "plotNumber" character varying NOT NULL,
                "sizeMarla" numeric(5,2) NOT NULL,
                "sizeSqm" numeric(8,2) NOT NULL,
                "phase" character varying NOT NULL,
                "block" character varying NOT NULL,
                "pricePkr" numeric(12,2) NOT NULL,
                "status" character varying NOT NULL DEFAULT 'available',
                "coordinates" text NOT NULL,
                "mapX" numeric(5,2),
                "mapY" numeric(5,2),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_plots_plotNumber" UNIQUE ("plotNumber"),
                CONSTRAINT "PK_plots_id" PRIMARY KEY ("id")
            )
        `);

        // Create customers table
        await queryRunner.query(`
            CREATE TABLE "customers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cnic" character varying NOT NULL,
                "fullName" character varying NOT NULL,
                "phone" character varying NOT NULL,
                "email" character varying,
                "address" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_customers_cnic" UNIQUE ("cnic"),
                CONSTRAINT "PK_customers_id" PRIMARY KEY ("id")
            )
        `);

        // Create bookings table
        await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "plotId" uuid NOT NULL,
                "createdById" uuid NOT NULL,
                "downPayment" numeric(12,2) NOT NULL,
                "totalAmount" numeric(12,2) NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "bookingDate" TIMESTAMP NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id")
            )
        `);

        // Create installments table
        await queryRunner.query(`
            CREATE TABLE "installments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "bookingId" uuid NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "dueDate" date NOT NULL,
                "paidDate" date,
                "status" character varying NOT NULL DEFAULT 'pending',
                "lateFee" numeric(12,2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_installments_id" PRIMARY KEY ("id")
            )
        `);

        // Create payment schedules table
        await queryRunner.query(`
            CREATE TABLE "payment_schedules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "bookingId" uuid NOT NULL,
                "installmentNumber" integer NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "dueDate" date NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "paidDate" date,
                "lateFee" numeric(12,2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_schedules_id" PRIMARY KEY ("id")
            )
        `);

        // Create payments table
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "bookingId" uuid NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "paymentDate" date NOT NULL,
                "paymentMethod" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "processedByUserId" uuid,
                "approvedByUserId" uuid,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payments_id" PRIMARY KEY ("id")
            )
        `);

        // Create payment proofs table
        await queryRunner.query(`
            CREATE TABLE "payment_proofs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentId" uuid NOT NULL,
                "fileName" character varying NOT NULL,
                "filePath" character varying NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying NOT NULL,
                "uploadedByUserId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_proofs_id" PRIMARY KEY ("id")
            )
        `);

        // Create payment plans table
        await queryRunner.query(`
            CREATE TABLE "payment_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "downPaymentPercentage" numeric(5,2) NOT NULL,
                "installmentCount" integer NOT NULL,
                "installmentIntervalDays" integer NOT NULL,
                "lateFeePercentage" numeric(5,2) NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_plans_id" PRIMARY KEY ("id")
            )
        `);

        // Create plot size pricing table
        await queryRunner.query(`
            CREATE TABLE "plot_size_pricing" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sizeMarla" numeric(5,2) NOT NULL,
                "pricePerMarla" numeric(12,2) NOT NULL,
                "phase" character varying NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_plot_size_pricing_id" PRIMARY KEY ("id")
            )
        `);

        // Create activity logs table
        await queryRunner.query(`
            CREATE TABLE "activity_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid,
                "action" character varying NOT NULL,
                "entityType" character varying NOT NULL,
                "entityId" uuid,
                "details" text,
                "ipAddress" character varying,
                "userAgent" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activity_logs_id" PRIMARY KEY ("id")
            )
        `);

        // Create documents table
        await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fileName" character varying NOT NULL,
                "filePath" character varying NOT NULL,
                "fileSize" integer NOT NULL,
                "mimeType" character varying NOT NULL,
                "entityType" character varying NOT NULL,
                "entityId" uuid NOT NULL,
                "uploadedByUserId" uuid NOT NULL,
                "reviewedByUserId" uuid,
                "status" character varying NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_documents_id" PRIMARY KEY ("id")
            )
        `);

        // Create audit logs table
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid,
                "action" character varying NOT NULL,
                "entityType" character varying NOT NULL,
                "entityId" uuid,
                "oldValues" text,
                "newValues" text,
                "ipAddress" character varying,
                "userAgent" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
            )
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "recipientId" uuid NOT NULL,
                "senderId" uuid,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "type" character varying NOT NULL,
                "isRead" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
            )
        `);

        // Create messages table
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "senderId" uuid NOT NULL,
                "recipientId" uuid NOT NULL,
                "subject" character varying,
                "content" text NOT NULL,
                "isRead" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
            )
        `);

        // Create leads table
        await queryRunner.query(`
            CREATE TABLE "leads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "phone" character varying NOT NULL,
                "email" character varying,
                "source" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'new',
                "priority" character varying NOT NULL DEFAULT 'medium',
                "assignedToUserId" uuid,
                "generatedByUserId" uuid,
                "convertedByUserId" uuid,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_leads_id" PRIMARY KEY ("id")
            )
        `);

        // Create lead communications table
        await queryRunner.query(`
            CREATE TABLE "lead_communications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "leadId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "content" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_lead_communications_id" PRIMARY KEY ("id")
            )
        `);

        // Create lead notes table
        await queryRunner.query(`
            CREATE TABLE "lead_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "leadId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "note" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_lead_notes_id" PRIMARY KEY ("id")
            )
        `);

        // Create sales activities table
        await queryRunner.query(`
            CREATE TABLE "sales_activities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "description" text NOT NULL,
                "customerId" uuid,
                "leadId" uuid,
                "bookingId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_sales_activities_id" PRIMARY KEY ("id")
            )
        `);

        // Create customer interactions table
        await queryRunner.query(`
            CREATE TABLE "customer_interactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "description" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customer_interactions_id" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_plotId" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "installments" ADD CONSTRAINT "FK_installments_bookingId" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "payment_schedules" ADD CONSTRAINT "FK_payment_schedules_bookingId" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_bookingId" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_processedByUserId" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_approvedByUserId" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "payment_proofs" ADD CONSTRAINT "FK_payment_proofs_paymentId" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_proofs" ADD CONSTRAINT "FK_payment_proofs_uploadedByUserId" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_activity_logs_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_uploadedByUserId" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_reviewedByUserId" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_recipientId" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_senderId" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_senderId" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_recipientId" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_assignedToUserId" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_generatedByUserId" FOREIGN KEY ("generatedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_convertedByUserId" FOREIGN KEY ("convertedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "lead_communications" ADD CONSTRAINT "FK_lead_communications_leadId" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_communications" ADD CONSTRAINT "FK_lead_communications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "lead_notes" ADD CONSTRAINT "FK_lead_notes_leadId" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_notes" ADD CONSTRAINT "FK_lead_notes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "sales_activities" ADD CONSTRAINT "FK_sales_activities_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales_activities" ADD CONSTRAINT "FK_sales_activities_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales_activities" ADD CONSTRAINT "FK_sales_activities_leadId" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales_activities" ADD CONSTRAINT "FK_sales_activities_bookingId" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "customer_interactions" ADD CONSTRAINT "FK_customer_interactions_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_interactions" ADD CONSTRAINT "FK_customer_interactions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        await queryRunner.query(`CREATE INDEX "IDX_plots_status" ON "plots" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_plots_phase_block" ON "plots" ("phase", "block")`);
        await queryRunner.query(`CREATE INDEX "IDX_bookings_customerId" ON "bookings" ("customerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_bookings_plotId" ON "bookings" ("plotId")`);
        await queryRunner.query(`CREATE INDEX "IDX_installments_dueDate" ON "installments" ("dueDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_cnic" ON "customers" ("cnic")`);
        await queryRunner.query(`CREATE INDEX "IDX_leads_status" ON "leads" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_leads_assignedToUserId" ON "leads" ("assignedToUserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_status" ON "payments" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_recipientId" ON "notifications" ("recipientId")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_isRead" ON "notifications" ("isRead")`);

        // Insert default admin user
        await queryRunner.query(`
            INSERT INTO "users" ("email", "passwordHash", "fullName", "role", "isActive") 
            VALUES (
                'admin@queenhills.com',
                '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4',
                'System Administrator',
                'admin',
                true
            )
        `);

        // Insert sample plots
        await queryRunner.query(`
            INSERT INTO "plots" ("plotNumber", "sizeMarla", "sizeSqm", "phase", "block", "pricePkr", "status", "coordinates") VALUES
            ('A-01', 5.0, 125.0, 'Phase 1', 'A', 2500000, 'available', '{"lat": 33.9078, "lng": 73.3907}'),
            ('A-02', 5.0, 125.0, 'Phase 1', 'A', 2500000, 'available', '{"lat": 33.9079, "lng": 73.3908}'),
            ('A-03', 5.0, 125.0, 'Phase 1', 'A', 2500000, 'sold', '{"lat": 33.9080, "lng": 73.3909}'),
            ('B-01', 10.0, 250.0, 'Phase 1', 'B', 5000000, 'available', '{"lat": 33.9081, "lng": 73.3910}'),
            ('B-02', 10.0, 250.0, 'Phase 1', 'B', 5000000, 'reserved', '{"lat": 33.9082, "lng": 73.3911}'),
            ('C-01', 20.0, 500.0, 'Phase 2', 'C', 10000000, 'available', '{"lat": 33.9083, "lng": 73.3912}')
        `);

        // Insert sample payment plans
        await queryRunner.query(`
            INSERT INTO "payment_plans" ("name", "description", "downPaymentPercentage", "installmentCount", "installmentIntervalDays", "lateFeePercentage") VALUES
            ('Standard Plan', 'Standard payment plan with monthly installments', 20.0, 12, 30, 2.0),
            ('Premium Plan', 'Premium payment plan with quarterly installments', 30.0, 8, 90, 1.5),
            ('VIP Plan', 'VIP payment plan with flexible installments', 40.0, 6, 60, 1.0)
        `);

        // Insert sample plot size pricing
        await queryRunner.query(`
            INSERT INTO "plot_size_pricing" ("sizeMarla", "pricePerMarla", "phase") VALUES
            (5.0, 500000, 'Phase 1'),
            (10.0, 450000, 'Phase 1'),
            (20.0, 400000, 'Phase 2')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_interactions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sales_activities"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "lead_notes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "lead_communications"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "leads"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "plot_size_pricing"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_plans"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_proofs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_schedules"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "installments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "plots"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    }
}
