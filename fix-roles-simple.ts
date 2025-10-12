import * as sqlite3 from 'sqlite3';
import * as bcrypt from 'bcryptjs';

const dbPath = './queen-hills.db';

async function fixRoles() {
  return new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Run the fixes in sequence
    db.serialize(() => {
      console.log('🔧 Fixing user roles...');

      // Step 1: Check current roles
      db.all("SELECT role, COUNT(*) as count FROM users GROUP BY role", (err, rows) => {
        if (err) {
          console.error('Error checking roles:', err);
          return;
        }
        console.log('\n📊 Current roles:');
        rows.forEach((row: any) => {
          console.log(`  - ${row.role}: ${row.count} users`);
        });
      });

      // Step 2: Update super_admin to admin
      db.run("UPDATE users SET role = 'admin' WHERE role = 'super_admin'", function(err) {
        if (err) {
          console.error('Error updating super_admin:', err);
        } else {
          console.log(`✅ Updated ${this.changes} super_admin users to admin`);
        }
      });

      // Step 3: Update sales_agent to sales_person
      db.run("UPDATE users SET role = 'sales_person' WHERE role = 'sales_agent'", function(err) {
        if (err) {
          console.error('Error updating sales_agent:', err);
        } else {
          console.log(`✅ Updated ${this.changes} sales_agent users to sales_person`);
        }
      });

      // Step 4: Create sales_activities table
      db.run(`
        CREATE TABLE IF NOT EXISTS "sales_activities" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "userId" TEXT NOT NULL,
          "activityType" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "entityType" TEXT,
          "entityId" TEXT,
          "metadata" TEXT,
          "potentialValue" REAL,
          "duration" INTEGER,
          "isSuccessful" INTEGER NOT NULL DEFAULT 0,
          "notes" TEXT,
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) {
          console.log('ℹ️ Sales activities table already exists or error:', err.message);
        } else {
          console.log('✅ Sales activities table created');
        }
      });

      // Step 5: Create indexes
      db.run("CREATE INDEX IF NOT EXISTS IDX_sales_activities_userId ON sales_activities (userId)", (err) => {
        if (err) console.log('Index creation error (may already exist):', err.message);
      });

      db.run("CREATE INDEX IF NOT EXISTS IDX_users_role ON users (role)", (err) => {
        if (err) console.log('Index creation error (may already exist):', err.message);
      });

      // Step 6: Ensure admin exists
      db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", async (err, row: any) => {
        if (err) {
          console.error('Error checking admin:', err);
          return;
        }

        if (row.count === 0) {
          console.log('👑 Creating default admin user...');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          const adminId = 'admin-' + Date.now().toString(36);

          db.run(`
            INSERT INTO users (id, email, passwordHash, fullName, role, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [adminId, 'admin@queenhills.com', hashedPassword, 'System Administrator', 'admin', 1], function(err) {
            if (err) {
              console.error('Error creating admin:', err);
            } else {
              console.log('✅ Default admin user created');
              console.log('   Email: admin@queenhills.com');
              console.log('   Password: admin123');
            }
          });
        } else {
          console.log('✅ Admin user already exists');
        }

        // Step 7: Final verification
        setTimeout(() => {
          db.all("SELECT role, COUNT(*) as count FROM users GROUP BY role", (err, rows) => {
            if (err) {
              console.error('Error in final check:', err);
            } else {
              console.log('\n📊 Final roles:');
              rows.forEach((row: any) => {
                console.log(`  - ${row.role}: ${row.count} users`);
              });
            }

            console.log('\n🎉 Database roles fixed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Stop the backend server (Ctrl+C if running)');
            console.log('2. Start the backend: npm run start:dev');
            console.log('3. Start the frontend: cd ../frontend && npm run dev');

            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
                reject(err);
              } else {
                console.log('📦 Database connection closed');
                resolve();
              }
            });
          });
        }, 1000); // Give time for all operations to complete
      });
    });
  });
}

// Run the fix
fixRoles().catch(console.error);
