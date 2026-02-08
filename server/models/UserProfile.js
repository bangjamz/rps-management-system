import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserProfile = sequelize.define('UserProfile', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    profile_type: {
        type: DataTypes.ENUM('dosen', 'mahasiswa'),
        allowNull: false
    },
    // Common fields
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    photo_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Dosen-specific fields
    nidn: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // unique: true, // Managed manually to avoid sync errors
        comment: 'Nomor Induk Dosen Nasional'
    },
    jabatan_fungsional: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g., Asisten Ahli, Lektor, Lektor Kepala, Profesor'
    },
    pendidikan_terakhir: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g., S2, S3'
    },
    bidang_keahlian: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    homebase: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status_kepegawaian: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Mahasiswa-specific fields
    nim: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // unique: true, // Managed manually
        comment: 'Nomor Induk Mahasiswa'
    },
    angkatan: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status_mahasiswa: {
        type: DataTypes.ENUM('aktif', 'cuti', 'lulus', 'dropout'),
        allowNull: true,
        defaultValue: 'aktif'
    },
    ipk: {
        type: DataTypes.DECIMAL(3, 2),
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
    tableName: 'user_profiles',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default UserProfile;
