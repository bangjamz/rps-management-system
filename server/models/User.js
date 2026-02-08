import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

import CustomAdminRole from './CustomAdminRole.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('user', 'mahasiswa', 'dosen', 'kaprodi', 'dekan', 'admin', 'superadmin', 'penjaminan_mutu', 'admin_institusi'),
        allowNull: false,
        defaultValue: 'user',
        comment: 'User role hierarchy: user < mahasiswa/dosen < kaprodi < dekan < admin < superadmin'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'suspended'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Account approval status'
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Email verification token'
    },
    verification_token_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    custom_permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Custom permissions array for admin roles'
    },
    custom_admin_role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'custom_admin_roles',
            key: 'id'
        },
        comment: 'Reference to custom admin role if applicable'
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Super admin who approved this account'
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    institusi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For admin_institusi role'
    },
    fakultas_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For dekan role'
    },
    prodi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For kaprodi, dosen, mahasiswa roles'
    },
    nidn: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'NIDN (Nomor Induk Dosen Nasional) atau NUPTK untuk dosen'
    },
    telepon: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Nomor telepon/HP'
    },
    nuptk: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'NUPTK (Nomor Unik Pendidik dan Tenaga Kependidikan)'
    },
    jabatan: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Jabatan struktural atau fungsional'
    },
    homebase: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Homebase program studi atau unit'
    },
    status_kepegawaian: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Status kepegawaian (DTPS, DTPT, Dosen)'
    },
    foto_profil: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL/Path foto profil'
    },
    signature: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL/Path to user signature image'
    },
    cover_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL/Path cover image (Notion style)'
    },
    available_roles: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of roles user can switch to, e.g. ["superadmin", "kaprodi", "dosen"]'
    },
    angkatan: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Tahun angkatan mahasiswa dalam format 4 digit, e.g. "2223" untuk angkatan 2022/2023'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Define associations


User.belongsTo(CustomAdminRole, { foreignKey: 'custom_admin_role_id', as: 'customAdminRole' });
CustomAdminRole.hasMany(User, { foreignKey: 'custom_admin_role_id' });

export default User;
