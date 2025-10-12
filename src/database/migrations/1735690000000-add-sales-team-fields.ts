import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesTeamFields1735690000000 implements MigrationInterface {
  name = 'AddSalesTeamFields1735690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "assignedToUserId" varchar,
      ADD COLUMN "department" varchar,
      ADD COLUMN "employeeId" varchar,
      ADD COLUMN "phone" varchar,
      ADD COLUMN "address" varchar,
      ADD COLUMN "workloadScore" integer NOT NULL DEFAULT 0
    `);

    // Add foreign key constraint for assignedToUserId
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_assignedToUserId" 
      FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Update UserRole enum to include SALES_MANAGER
    await queryRunner.query(`
      ALTER TYPE "user_role_enum" ADD VALUE 'sales_manager'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "FK_users_assignedToUserId"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "assignedToUserId",
      DROP COLUMN "department",
      DROP COLUMN "employeeId",
      DROP COLUMN "phone",
      DROP COLUMN "address",
      DROP COLUMN "workloadScore"
    `);

    // Note: We cannot easily remove enum values in PostgreSQL
    // The sales_manager value will remain in the enum but won't be used
  }
}
