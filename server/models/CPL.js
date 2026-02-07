import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CPL = sequelize.define('CPL', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pl_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to Profil Lulusan (for prodi-level CPL)'
    },
    level: {
        type: DataTypes.ENUM('institusi', 'fakultas', 'prodi'),
        allowNull: false,
        defaultValue: 'prodi'
    },
    institusi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For institut-level CPL'
    },
    fakultas_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For fakultas-level CPL'
    },
    prodi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For prodi-level CPL'
    },
    kode_cpl: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Internal unique code with prefix, e.g., IF-CPL01'
    },
    kode_tampilan: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Display code for RPS, e.g., CPL01'
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    keterangan: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'S01, KU01, WAJIB, etc'
    },
    kategori: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Sikap, Pengetahuan, Keterampilan Umum, Keterampilan Khusus'
    },
    is_mandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True for institusi/fakultas level CPLs that are mandatory for lower levels'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'cpl',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['kode_cpl']
        },
        {
            unique: true,
            fields: ['kode_tampilan', 'prodi_id'],
            name: 'unique_display_code_per_prodi'
        }
    ],
    validate: {
        hasOneOrganizationLevel() {
            const levels = [this.institusi_id, this.fakultas_id, this.prodi_id].filter(id => id != null);
            const levelCount = levels.length;
            if (levelCount !== 1) {
                throw new Error('CPL must belong to exactly one organizational level (institusi, fakultas, or prodi)');
            }

            // Validate level matches the set ID
            if (this.level === 'institusi' && !this.institusi_id) {
                throw new Error('Institut-level CPL must have institusi_id set');
            }
            if (this.level === 'fakultas' && !this.fakultas_id) {
                throw new Error('Fakultas-level CPL must have fakultas_id set');
            }
            if (this.level === 'prodi' && !this.prodi_id) {
                throw new Error('Prodi-level CPL must have prodi_id set');
            }
        }
    }
});

export default CPL;

