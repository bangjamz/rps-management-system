import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CPMK = sequelize.define('CPMK', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    level: {
        type: DataTypes.ENUM('institusi', 'fakultas', 'prodi'),
        allowNull: false,
        defaultValue: 'prodi'
    },
    institusi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For institut-level CPMK'
    },
    fakultas_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For fakultas-level CPMK'
    },
    prodi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Prodi ID for filtering and uniqueness'
    },
    mata_kuliah_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Optional - null for template CPMK not tied to specific MK'
    },
    cpl_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to CPL - optional mapping'
    },
    kode_cpmk: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Internal code with prefix, e.g., IF-CPMK01'
    },
    kode_tampilan: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Display code for RPS, e.g., CPMK01'
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_template: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'True = master template from kurikulum, False = dosen custom'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID who created this CPMK'
    }
}, {
    tableName: 'cpmk',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['kode_cpmk']
        },
        {
            unique: true,
            fields: ['kode_tampilan', 'prodi_id'],
            name: 'unique_cpmk_display_per_prodi'
        },
        {
            fields: ['mata_kuliah_id']
        }
    ],
    validate: {
        hasOneOrganizationLevel() {
            const levels = [this.institusi_id, this.fakultas_id, this.prodi_id].filter(id => id != null);
            if (levels.length !== 1) {
                throw new Error('CPMK must belong to exactly one organizational level (institusi, fakultas, or prodi)');
            }
            if (this.level === 'institusi' && !this.institusi_id) throw new Error('Institusi level CPMK must have institusi_id');
            if (this.level === 'fakultas' && !this.fakultas_id) throw new Error('Fakultas level CPMK must have fakultas_id');
            if (this.level === 'prodi' && !this.prodi_id) throw new Error('Prodi level CPMK must have prodi_id');
        }
    }
});

export default CPMK;
