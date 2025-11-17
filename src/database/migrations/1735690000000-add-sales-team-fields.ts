import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesTeamFields1735690000000 implements MigrationInterface {
  name = 'AddSalesTeamFields1735690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table (only if table exists)
    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      // SQLite only supports adding one column at a time
      const hasAssignedToUserId = usersTable.findColumnByName('assignedToUserId');
      const hasDepartment = usersTable.findColumnByName('department');
      const hasEmployeeId = usersTable.findColumnByName('employeeId');
      const hasPhone = usersTable.findColumnByName('phone');
      const hasAddress = usersTable.findColumnByName('address');
      const hasWorkloadScore = usersTable.findColumnByName('workloadScore');

      if (!hasAssignedToUserId) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "assignedToUserId" varchar`);
      }
      if (!hasDepartment) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "department" varchar`);
      }
      if (!hasEmployeeId) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "employeeId" varchar`);
      }
      if (!hasPhone) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "phone" varchar`);
      }
      if (!hasAddress) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "address" varchar`);
      }
      if (!hasWorkloadScore) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "workloadScore" integer NOT NULL DEFAULT 0`);
      }

      // Note: SQLite doesn't support adding foreign key constraints via ALTER TABLE
      // TypeORM will handle the relationship through entity decorators
    }
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
