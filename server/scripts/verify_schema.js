
import sequelize from '../config/database.js';

const verify = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('global_settings');
        console.log('Columns in global_settings:', Object.keys(tableInfo));
        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

verify();
