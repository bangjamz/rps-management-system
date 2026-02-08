import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const GlobalSettings = sequelize.define('GlobalSettings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_pt: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Institut Teknologi dan Kesehatan Mahardika'
    },

    logo_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to uploaded logo file'
    },
    logo_filename: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    favicon_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to uploaded favicon file'
    },
    favicon_filename: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    default_lms_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'SIBEDA',
        comment: 'Default LMS name to suggest in RPS editor'
    },
    default_lms_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: 'sibeda.mahardika.ac.id',
        comment: 'Default LMS URL to suggest in RPS editor'
    },
    alamat_pt: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Alamat lengkap perguruan tinggi'
    },
    kode_pt: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Kode Perguruan Tinggi'
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Website resmi'
    },
    social_media: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'JSON storing social media links (facebook, instagram, etc.)'
    },
    color_palette: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            primary: '#3b82f6', // blue-500
            secondary: '#64748b', // slate-500
            accent: '#f59e0b', // amber-500
            background: '#ffffff',
            text: '#1f2937'
        },
        comment: 'JSON storing color palette configuration'
    },
    kop_surat_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to uploaded kop surat file'
    },
    kop_surat_filename: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'global_settings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default GlobalSettings;
