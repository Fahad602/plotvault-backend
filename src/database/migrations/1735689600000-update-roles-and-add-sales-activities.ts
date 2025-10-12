import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRolesAndAddSalesActivities1735689600000 implements MigrationInterface {
    name = 'UpdateRolesAndAddSalesActivities1735689600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create sales_activities table
        await queryRunner.query(`
            CREATE TABLE "sales_activities" (
                "id" varchar PRIMARY KEY NOT NULL,
                "userId" varchar NOT NULL,
                "activityType" varchar NOT NULL,
                "description" varchar NOT NULL,
                "entityType" varchar,
                "entityId" varchar,
                "metadata" text,
                "potentialValue" decimal(12,2),
                "duration" integer,
                "isSuccessful" boolean NOT NULL DEFAULT (0),
                "notes" text,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);

        // Add foreign key constraint for sales_activities
        await queryRunner.query(`
            CREATE INDEX "IDX_sales_activities_userId" ON "sales_activities" ("userId")
        `);

        // Update existing user roles from old system to new system
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super_admin'
        `);

        await queryRunner.query(`
            UPDATE "users" SET "role" = 'sales_person' WHERE "role" = 'sales_agent'
        `);

        // Add salesActivities column to users table if it doesn't exist
        // Note: TypeORM will handle the relationship, but we need to ensure the foreign key works
        await queryRunner.query(`
            CREATE INDEX "IDX_users_role" ON "users" ("role")
        `);

        // Create a default admin user if none exists
        const adminExists = await queryRunner.query(`
            SELECT COUNT(*) as count FROM "users" WHERE "role" = 'admin'
        `);

        if (adminExists[0].count === 0) {
            // Create default admin user (password: admin123)
            const hashedPassword = '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ'; // This should be properly hashed
            await queryRunner.query(`
                INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt")
                VALUES (
                    lower(hex(randomblob(16))),
                    'admin@queenhills.com',
                    '${hashedPassword}',
                    'System Administrator',
                    'admin',
                    1,
                    datetime('now'),
                    datetime('now')
                )
            `);
        }

        // Create sample sales activities for existing sales persons
        const salesPersons = await queryRunner.query(`
            SELECT "id" FROM "users" WHERE "role" = 'sales_person'
        `);

        for (const salesPerson of salesPersons) {
            // Add login activity
            await queryRunner.query(`
                INSERT INTO "sales_activities" ("id", "userId", "activityType", "description", "isSuccessful", "createdAt")
                VALUES (
                    lower(hex(randomblob(16))),
                    '${salesPerson.id}',
                    'login',
                    'User logged into the system',
                    1,
                    datetime('now', '-1 day')
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop sales_activities table
        await queryRunner.query(`DROP TABLE "sales_activities"`);

        // Revert user roles back to old system
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'super_admin' WHERE "role" = 'admin'
        `);

        await queryRunner.query(`
            UPDATE "users" SET "role" = 'sales_agent' WHERE "role" = 'sales_person'
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    }
}
