import sequelize from '../config/database.js';

const migrateEnum = async () => {
    try {
        console.log('🔄 Manually migrating Role ENUM...');

        // 1. Rename old column
        await sequelize.query('ALTER TABLE "users" RENAME COLUMN "role" TO "role_old";');

        // 2. Create new ENUM type (if not exists)
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role_new') THEN
                    CREATE TYPE "enum_users_role_new" AS ENUM('user', 'mahasiswa', 'dosen', 'kaprodi', 'dekan', 'admin', 'superadmin');
                END IF;
            END$$;
        `);

        // 3. Add new column with new type
        await sequelize.query('ALTER TABLE "users" ADD COLUMN "role" "enum_users_role_new";');

        // 4. Map old values to new values
        // Note: old values were 'admin_institusi', 'dekan', 'kaprodi', 'dosen', 'mahasiswa'
        // 'admin_institusi' -> 'admin'
        await sequelize.query(`
            UPDATE "users" 
            SET "role" = CASE 
                WHEN "role_old"::text = 'admin_institusi' THEN 'admin'::"enum_users_role_new"
                WHEN "role_old"::text IN ('mahasiswa', 'dosen', 'kaprodi', 'dekan') THEN "role_old"::text::"enum_users_role_new"
                ELSE 'user'::"enum_users_role_new"
            END;
        `);

        // 5. Set default and not null
        await sequelize.query('ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT \'user\';');
        await sequelize.query('ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;');

        // 6. Drop old column and type
        await sequelize.query('ALTER TABLE "users" DROP COLUMN "role_old";');
        await sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');

        // 7. Rename new type to match sequelize expectation (optional but good for consistency)
        await sequelize.query('ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";');

        console.log('✅ Role ENUM migration successful.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateEnum();
