import sequelize from '../config/database.js';
import GlobalSettings from '../models/GlobalSettings.js';

const fixGlobalSettings = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        console.log('🔄 Syncing GlobalSettings...');
        await GlobalSettings.sync({ alter: true });
        console.log('✅ GlobalSettings table synced');

        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
};

fixGlobalSettings();
