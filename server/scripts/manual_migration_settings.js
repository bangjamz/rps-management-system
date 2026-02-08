
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

console.log('Starting migration script...');

const migrate = async () => {
    console.log('Inside migrate function...');
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('global_settings');

        if (!tableInfo.alamat_pt) {
            await queryInterface.addColumn('global_settings', 'alamat_pt', {
                type: DataTypes.TEXT,
                allowNull: true
            });
            console.log('Added alamat_pt');
        }

        if (!tableInfo.kode_pt) {
            await queryInterface.addColumn('global_settings', 'kode_pt', {
                type: DataTypes.STRING(20),
                allowNull: true
            });
            console.log('Added kode_pt');
        }

        if (!tableInfo.website) {
            await queryInterface.addColumn('global_settings', 'website', {
                type: DataTypes.STRING(255),
                allowNull: true
            });
            console.log('Added website');
        }

        if (!tableInfo.social_media) {
            await queryInterface.addColumn('global_settings', 'social_media', {
                type: DataTypes.JSON,
                allowNull: true
            });
            console.log('Added social_media');
        }

        if (!tableInfo.kop_surat_path) {
            await queryInterface.addColumn('global_settings', 'kop_surat_path', {
                type: DataTypes.STRING(500),
                allowNull: true
            });
            console.log('Added kop_surat_path');
        }

        if (!tableInfo.kop_surat_filename) {
            await queryInterface.addColumn('global_settings', 'kop_surat_filename', {
                type: DataTypes.STRING(255),
                allowNull: true
            });
            console.log('Added kop_surat_filename');
        }

        console.log('Migration completed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
