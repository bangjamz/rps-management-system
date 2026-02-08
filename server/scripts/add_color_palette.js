import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const migrate = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('global_settings');

        if (!tableInfo.color_palette) {
            console.log('Adding color_palette column...');
            await queryInterface.addColumn('global_settings', 'color_palette', {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: {
                    primary: '#3b82f6',
                    secondary: '#64748b',
                    accent: '#f59e0b',
                    background: '#ffffff',
                    text: '#1f2937'
                }
            });
            console.log('color_palette column added.');
        } else {
            console.log('color_palette column already exists.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
