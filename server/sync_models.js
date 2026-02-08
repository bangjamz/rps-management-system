import sequelize from './config/database.js';
import User from './models/User.js';
import GlobalSettings from './models/GlobalSettings.js';
import CustomAdminRole from './models/CustomAdminRole.js';
import UserProfile from './models/UserProfile.js';

const syncDatabase = async () => {
    try {
        console.log('🔄 Syncing database schema...');

        // Register models (ensure they are loaded)
        // Note: In Sequelize, defining models registers them automatically if using the same sequelize instance

        // Sync all models
        await sequelize.sync({ alter: true });

        console.log('✅ Base models synchronized.');

        // Initialize Global Settings if empty
        const settingsCount = await GlobalSettings.count();
        if (settingsCount === 0) {
            await GlobalSettings.create({
                nama_pt: 'Institut Teknologi dan Kesehatan Mahardika',
                default_lms_name: 'SIBEDA',
                default_lms_url: 'sibeda.mahardika.ac.id'
            });
            console.log('✅ Default global settings created.');
        }

        console.log('🎉 Database synchronization complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
};

syncDatabase();
