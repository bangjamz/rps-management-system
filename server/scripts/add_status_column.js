import sequelize from '../config/database.js';

const addStatusColumn = async () => {
    try {
        console.log('🔄 Manually adding status column...');

        // 1. Create ENUM type (if not exists)
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_status') THEN
                    CREATE TYPE "enum_users_status" AS ENUM('pending', 'approved', 'rejected', 'active', 'suspended');
                END IF;
            END$$;
        `);

        // 2. Add column with default value (if not exists)
        try {
            await sequelize.query('ALTER TABLE "users" ADD COLUMN "status" "enum_users_status" DEFAULT \'pending\' NOT NULL;');
            console.log('✅ Status column added.');
        } catch (e) {
            console.log('Info: Status column might already exist:', e.message);
        }

        // 3. Add other missing columns safely
        const columns = [
            { name: 'email_verified', type: 'BOOLEAN DEFAULT false' },
            { name: 'verification_token', type: 'VARCHAR(255)' },
            { name: 'verification_token_expires', type: 'TIMESTAMP WITH TIME ZONE' },
            { name: 'custom_permissions', type: 'JSON' },
            { name: 'approved_by', type: 'INTEGER' },
            { name: 'approved_at', type: 'TIMESTAMP WITH TIME ZONE' },
            { name: 'custom_admin_role_id', type: 'INTEGER' }
        ];

        for (const col of columns) {
            try {
                await sequelize.query(`ALTER TABLE "users" ADD COLUMN "${col.name}" ${col.type};`);
                console.log(`✅ Added column ${col.name}`);
            } catch (e) {
                // Ignore if exists
            }
        }

        console.log('✅ User table schema update complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

addStatusColumn();
