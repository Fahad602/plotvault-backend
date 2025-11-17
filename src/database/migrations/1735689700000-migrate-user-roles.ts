import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateUserRoles1735689700000 implements MigrationInterface {
    name = 'MigrateUserRoles1735689700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Create sales_activities table first
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sales_activities" (
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

        // Step 2: Add indexes for sales_activities
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_sales_activities_userId" ON "sales_activities" ("userId")
        `);

        // Step 3: Update existing user roles to new values BEFORE changing schema (only if users table exists)
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            console.log('Updating existing user roles...');
            
            // Update super_admin to admin
            const superAdminCount = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'super_admin'
            `);
            if (superAdminCount[0]?.count > 0) {
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super_admin'
                `);
                console.log(`Updated ${superAdminCount[0].count} super_admin users to admin`);
            }

            // Update sales_agent to sales_person
            const salesAgentCount = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'sales_agent'
            `);
            if (salesAgentCount[0]?.count > 0) {
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'sales_person' WHERE "role" = 'sales_agent'
                `);
                console.log(`Updated ${salesAgentCount[0].count} sales_agent users to sales_person`);
            }

            // Step 4: Verify all roles are valid before schema change
            const invalidRoles = await queryRunner.query(`
                SELECT DISTINCT "role" FROM "users" 
                WHERE "role" NOT IN ('admin', 'sales_person', 'accountant', 'investor', 'buyer', 'auditor')
            `);
            
            if (invalidRoles.length > 0) {
                console.log('Found invalid roles:', invalidRoles.map(r => r.role));
                // Update any other invalid roles to buyer (default)
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'buyer' 
                    WHERE "role" NOT IN ('admin', 'sales_person', 'accountant', 'investor', 'buyer', 'auditor')
                `);
            }
        }

        // Step 5: Now it's safe to update the schema with the new CHECK constraint (only if users table exists)
        const usersTableForSchema = await queryRunner.getTable('users');
        if (usersTableForSchema) {
            // Create temporary table with new schema
            await queryRunner.query(`
                CREATE TABLE "users_new" (
                    "id" varchar PRIMARY KEY NOT NULL,
                    "email" varchar NOT NULL,
                    "passwordHash" varchar NOT NULL,
                    "fullName" varchar NOT NULL,
                    "role" varchar CHECK( "role" IN ('admin','sales_person','accountant','investor','buyer','auditor') ) NOT NULL DEFAULT ('buyer'),
                    "isActive" boolean NOT NULL DEFAULT (1),
                    "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                    "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
                )
            `);

            // Copy data to new table (all roles should now be valid)
            await queryRunner.query(`
                INSERT INTO "users_new" ("id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt")
                SELECT "id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt"
                FROM "users"
            `);

            // Drop old table and rename new one
            await queryRunner.query(`DROP TABLE "users"`);
            await queryRunner.query(`ALTER TABLE "users_new" RENAME TO "users"`);

            // Step 6: Add index for role
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
            `);

            // Step 7: Create default admin if none exists
            const adminExists = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'admin'
            `);

            if (adminExists[0]?.count === 0) {
                console.log('Creating default admin user...');
                // Create a proper UUID-like ID
                const adminId = 'admin-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                await queryRunner.query(`
                    INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt")
                    VALUES (
                        '${adminId}',
                        'admin@queenhills.com',
                        '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ',
                        'System Administrator',
                        'admin',
                        1,
                        datetime('now'),
                        datetime('now')
                    )
                `);
                console.log('Default admin user created');
            }
        }

        console.log('✅ User roles migration completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert role changes
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'super_admin' WHERE "role" = 'admin'
        `);

        await queryRunner.query(`
            UPDATE "users" SET "role" = 'sales_agent' WHERE "role" = 'sales_person'
        `);

        // Drop sales_activities table
        await queryRunner.query(`DROP TABLE IF EXISTS "sales_activities"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);

        console.log('✅ User roles migration reverted');
    }
}
