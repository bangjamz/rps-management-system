
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const addSignatureColumn = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('users');

        if (!tableInfo.signature) {
            console.log('Adding signature column to users table...');
            await queryInterface.addColumn('users', 'signature', {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'URL/Path to user signature image'
            });
            console.log('✅ Signature column added.');
        } else {
            console.log('ℹ️ Signature column already exists.');
        }

    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        process.exit();
    }
};

addSignatureColumn();
