import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstallmentTypeAndDescription1703100000000 implements MigrationInterface {
    name = 'AddInstallmentTypeAndDescription1703100000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const installmentsTable = await queryRunner.getTable('installments');
    if (installmentsTable) {
      const hasInstallmentType = installmentsTable.findColumnByName('installmentType');
      const hasDescription = installmentsTable.findColumnByName('description');

      if (!hasInstallmentType) {
        await queryRunner.query(`
          ALTER TABLE "installments" 
          ADD COLUMN "installmentType" varchar NULL
        `);
      }

      if (!hasDescription) {
        await queryRunner.query(`
          ALTER TABLE "installments" 
          ADD COLUMN "description" varchar NULL
        `);
      }
    }
  }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "installments" 
            DROP COLUMN "installmentType",
            DROP COLUMN "description"
        `);
    }
}
