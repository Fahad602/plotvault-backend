import { DataSource } from 'typeorm';
import { User, UserRole } from './src/users/user.entity';
import { SalesActivity } from './src/users/sales-activity.entity';
import * as bcrypt from 'bcryptjs';

// Database configuration
const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'queen-hills.db',
  entities: [User, SalesActivity],
  synchronize: false, // Don't auto-sync to avoid conflicts
  logging: true,
});

async function fixDatabaseRoles() {
  try {
    console.log('🔧 Fixing database roles...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');

    // Step 1: Check current roles in database
    console.log('\n📊 Checking current user roles...');
    const currentRoles = await AppDataSource.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    
    console.log('Current roles in database:');
    currentRoles.forEach((role: any) => {
      console.log(`  - ${role.role}: ${role.count} users`);
    });

    // Step 2: Update roles manually
    console.log('\n🔄 Updating user roles...');
    
    // Update super_admin to admin
    const superAdminUpdate = await AppDataSource.query(`
      UPDATE users SET role = 'admin' WHERE role = 'super_admin'
    `);
    console.log(`✅ Updated super_admin → admin`);

    // Update sales_agent to sales_person
    const salesAgentUpdate = await AppDataSource.query(`
      UPDATE users SET role = 'sales_person' WHERE role = 'sales_agent'
    `);
    console.log(`✅ Updated sales_agent → sales_person`);

    // Step 3: Create sales_activities table if it doesn't exist
    console.log('\n📋 Creating sales_activities table...');
    try {
      await AppDataSource.query(`
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
      console.log('✅ Sales activities table created');
    } catch (error) {
      console.log('ℹ️ Sales activities table already exists');
    }

    // Step 4: Add indexes
    try {
      await AppDataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_sales_activities_userId" ON "sales_activities" ("userId")
      `);
      await AppDataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
      `);
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('ℹ️ Indexes already exist');
    }

    // Step 5: Verify all roles are now valid
    console.log('\n🔍 Verifying updated roles...');
    const updatedRoles = await AppDataSource.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    
    console.log('Updated roles in database:');
    updatedRoles.forEach((role: any) => {
      console.log(`  - ${role.role}: ${role.count} users`);
    });

    // Step 6: Check for any invalid roles
    const validRoles = ['admin', 'sales_person', 'accountant', 'investor', 'buyer', 'auditor'];
    const invalidRoles = updatedRoles.filter((role: any) => !validRoles.includes(role.role));
    
    if (invalidRoles.length > 0) {
      console.log('\n⚠️ Found invalid roles, fixing...');
      await AppDataSource.query(`
        UPDATE users SET role = 'buyer' 
        WHERE role NOT IN ('admin', 'sales_person', 'accountant', 'investor', 'buyer', 'auditor')
      `);
      console.log('✅ Fixed invalid roles');
    } else {
      console.log('✅ All roles are valid');
    }

    // Step 7: Ensure admin user exists
    const adminExists = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);

    if (adminExists[0].count === 0) {
      console.log('\n👑 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminId = 'admin-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      await AppDataSource.query(`
        INSERT INTO users (id, email, passwordHash, fullName, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [adminId, 'admin@queenhills.com', hashedPassword, 'System Administrator', 'admin', 1]);
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@queenhills.com');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('\n🎉 Database roles fixed successfully!');
    console.log('\n📋 You can now start the application:');
    console.log('   Backend: npm run start:dev');
    console.log('   Frontend: cd ../frontend && npm run dev');

  } catch (error) {
    console.error('❌ Error fixing database roles:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('📦 Database connection closed.');
    process.exit(0);
  }
}

// Run the fix
fixDatabaseRoles();
