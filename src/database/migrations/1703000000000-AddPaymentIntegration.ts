import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentIntegration1703000000000 implements MigrationInterface {
  name = 'AddPaymentIntegration1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_plans table
    await queryRunner.query(`
      CREATE TABLE "payment_plans" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL,
        "plotSizeMarla" decimal(5,2) NOT NULL,
        "plotPrice" decimal(12,2) NOT NULL,
        "downPaymentAmount" decimal(12,2),
        "downPaymentPercentage" decimal(5,2),
        "monthlyPayment" decimal(12,2) NOT NULL,
        "quarterlyPayment" decimal(12,2),
        "biYearlyPayment" decimal(12,2),
        "triannualPayment" decimal(12,2),
        "tenureMonths" integer NOT NULL DEFAULT 24,
        "status" varchar NOT NULL DEFAULT 'active',
        "notes" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create payment_proofs table
    await queryRunner.query(`
      CREATE TABLE "payment_proofs" (
        "id" varchar PRIMARY KEY NOT NULL,
        "paymentId" varchar NOT NULL,
        "fileName" varchar NOT NULL,
        "filePath" varchar NOT NULL,
        "fileSize" integer NOT NULL,
        "mimeType" varchar NOT NULL,
        "proofType" varchar NOT NULL DEFAULT 'screenshot',
        "description" text,
        "uploadedBy" varchar,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Add new columns to bookings table (only if table exists)
    const bookingsTable = await queryRunner.getTable('bookings');
    if (bookingsTable) {
      const hasPaidAmount = bookingsTable.findColumnByName('paidAmount');
      const hasPendingAmount = bookingsTable.findColumnByName('pendingAmount');

      if (!hasPaidAmount) {
        await queryRunner.query(`
          ALTER TABLE "bookings" 
          ADD COLUMN "paidAmount" decimal(12,2) DEFAULT 0
        `);
      }
      
      if (!hasPendingAmount) {
        await queryRunner.query(`
          ALTER TABLE "bookings" 
          ADD COLUMN "pendingAmount" decimal(12,2) DEFAULT 0
        `);
      }

      // Update existing bookings to set pendingAmount = totalAmount - paidAmount
      await queryRunner.query(`
        UPDATE "bookings" 
        SET "pendingAmount" = "totalAmount" - COALESCE("paidAmount", 0)
      `);
    }

    // Add paymentPlanId column to payment_schedules table (only if table exists)
    const paymentSchedulesTable = await queryRunner.getTable('payment_schedules');
    if (paymentSchedulesTable) {
      const hasPaymentPlanId = paymentSchedulesTable.findColumnByName('paymentPlanId');
      if (!hasPaymentPlanId) {
        await queryRunner.query(`
          ALTER TABLE "payment_schedules" 
          ADD COLUMN "paymentPlanId" varchar
        `);
      }
    }

    // Note: SQLite foreign key constraints are handled by TypeORM automatically
    // We'll let TypeORM manage the relationships rather than adding explicit constraints
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from existing tables
    await queryRunner.query(`
      ALTER TABLE "payment_schedules" 
      DROP COLUMN "paymentPlanId"
    `);

    // Note: SQLite doesn't support dropping multiple columns in one statement
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP COLUMN "paidAmount"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP COLUMN "pendingAmount"
    `);

    // Drop new tables
    await queryRunner.query(`DROP TABLE "payment_proofs"`);
    await queryRunner.query(`DROP TABLE "payment_plans"`);
  }
}
