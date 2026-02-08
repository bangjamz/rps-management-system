import sequelize from './config/database.js';

const fixDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();

        // Add status column
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';`);
            console.log('Added status column');
        } catch (e) {
            console.log('Error adding status column (might exist):', e.message);
        }

        // Add email_verified
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;`);
            console.log('Added email_verified column');
        } catch (e) {
            console.log('Error adding email_verified column (might exist):', e.message);
        }

        // Add verification_token
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);`);
            console.log('Added verification_token column');
        } catch (e) {
            console.log('Error adding verification_token column (might exist):', e.message);
        }

        // Add verification_token_expires
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;`);
            console.log('Added verification_token_expires column');
        } catch (e) {
            console.log('Error adding verification_token_expires column (might exist):', e.message);
        }

        // Add custom_permissions
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_permissions JSON;`);
            console.log('Added custom_permissions column');
        } catch (e) {
            console.log('Error adding custom_permissions column (might exist):', e.message);
        }

        // Add custom_admin_role_id
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_admin_role_id INTEGER;`);
            console.log('Added custom_admin_role_id column');
        } catch (e) {
            console.log('Error adding custom_admin_role_id column (might exist):', e.message);
        }

        // Add approved_by
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER;`);
            console.log('Added approved_by column');
        } catch (e) {
            console.log('Error adding approved_by column (might exist):', e.message);
        }

        // Add approved_at
        try {
            await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;`);
            console.log('Added approved_at column');
        } catch (e) {
            console.log('Error adding approved_at column (might exist):', e.message);
        }

        // Add homebase and status_kepegawaian to user_profiles
        try {
            await sequelize.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS homebase VARCHAR(100);`);
            await sequelize.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status_kepegawaian VARCHAR(100);`);
            console.log('Added homebase and status_kepegawaian to user_profiles');
        } catch (e) {
            console.log('Error adding profile columns:', e.message);
        }


        console.log('Database fix completed.');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};

fixDatabase();
