import * as sqlite3 from 'sqlite3';
import * as bcrypt from 'bcryptjs';

const dbPath = './queen-hills.db';

async function fixRolesAdvanced() {
  return new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    db.serialize(() => {
      console.log('🔧 Fixing user roles with constraint workaround...');

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

      // Step 2: Create a new users table without constraints
      console.log('\n🔄 Creating temporary users table...');
      db.run(`
        CREATE TABLE users_temp (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL UNIQUE,
          passwordHash TEXT NOT NULL,
          fullName TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'buyer',
          isActive INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) {
          console.error('Error creating temp table:', err);
          return;
        }

        // Step 3: Copy data with role transformations
        console.log('📋 Copying and transforming user data...');
        db.run(`
          INSERT INTO users_temp (id, email, passwordHash, fullName, role, isActive, createdAt, updatedAt)
          SELECT 
            id, 
            email, 
            passwordHash, 
            fullName,
            CASE 
              WHEN role = 'super_admin' THEN 'admin'
              WHEN role = 'sales_agent' THEN 'sales_person'
              ELSE role
            END as role,
            isActive,
            createdAt,
            updatedAt
          FROM users
        `, function(err) {
          if (err) {
            console.error('Error copying data:', err);
            return;
          }

          console.log(`✅ Copied and transformed ${this.changes} users`);

          // Step 4: Drop old table and rename temp table
          db.run("DROP TABLE users", (err) => {
            if (err) {
              console.error('Error dropping old table:', err);
              return;
            }

            db.run("ALTER TABLE users_temp RENAME TO users", (err) => {
              if (err) {
                console.error('Error renaming table:', err);
                return;
              }

              console.log('✅ Users table updated successfully');

              // Step 5: Create sales_activities table
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
                  console.log('ℹ️ Sales activities table may already exist:', err.message);
                } else {
                  console.log('✅ Sales activities table created');
                }
              });

              // Step 6: Create indexes
              db.run("CREATE INDEX IF NOT EXISTS IDX_sales_activities_userId ON sales_activities (userId)");
              db.run("CREATE INDEX IF NOT EXISTS IDX_users_role ON users (role)");
              db.run("CREATE INDEX IF NOT EXISTS IDX_users_email ON users (email)");

              // Step 7: Ensure admin exists
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
                    finishUp();
                  });
                } else {
                  console.log('✅ Admin user already exists');
                  finishUp();
                }
              });

              function finishUp() {
                // Step 8: Final verification
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
                    console.log('1. The database is now compatible with the new role system');
                    console.log('2. Start the backend: npm run start:dev');
                    console.log('3. Start the frontend: cd ../frontend && npm run dev');
                    console.log('4. Test login with: admin@queenhills.com / admin123');

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
                }, 500);
              }
            });
          });
        });
      });
    });
  });
}

// Run the fix
fixRolesAdvanced().catch(console.error);
