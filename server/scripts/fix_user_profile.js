import sequelize from '../config/database.js';

const fixUserProfileSchema = async () => {
    try {
        console.log('🔧 Fixing UserProfile schema...');

        // 1. Drop the constraint if it exists (to start fresh)
        try {
            await sequelize.query('ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_nidn_key";');
        } catch (e) { console.log('Constraint might not exist yet.'); }

        // 2. Add Unique Constraint safely
        // Note: We cannot just add UNIQUE in the ALTER COLUMN statement in Postgres like MySQL
        try {
            await sequelize.query('ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_nidn_key" UNIQUE ("nidn");');
            console.log('✅ Added UNIQUE constraint to nidn.');
        } catch (e) {
            console.log('Info: NIDN constraint might already exist or failed:', e.message);
        }

        // 3. Ensure columns are correct types
        await sequelize.query('ALTER TABLE "user_profiles" ALTER COLUMN "nidn" TYPE VARCHAR(20);');

        // 4. Fix NIM Constraint
        try {
            await sequelize.query('ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_nim_key";');
        } catch (e) { }

        try {
            await sequelize.query('ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_nim_key" UNIQUE ("nim");');
            console.log('✅ Added UNIQUE constraint to nim.');
        } catch (e) {
            console.log('Info: NIM constraint might already exist:', e.message);
        }

        console.log('✅ UserProfile schema fix applied.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fix failed:', error);
        process.exit(1);
    }
};

fixUserProfileSchema();
