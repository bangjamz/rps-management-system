
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BahanKajian = sequelize.define('BahanKajian', {
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
        comment: 'For institut-level BK'
    },
    fakultas_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For fakultas-level BK'
    },
    prodi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For prodi-level BK'
    },
    kode_bk: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Internal code with prefix, e.g., IF-BK01'
    },
    kode_tampilan: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Display code for RPS, e.g., BK01'
    },
    jenis: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Inti / Institusional / IPTEKS / dll'
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    bobot_min: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
    },
    bobot_max: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
    }
}, {
    tableName: 'bahan_kajian',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['prodi_id', 'kode_bk'],
            unique: true
        },
        {
            fields: ['kode_tampilan', 'prodi_id'],
            unique: true,
            name: 'unique_bk_display_per_prodi'
        }
    ],
    validate: {
        hasOneOrganizationLevel() {
            const levels = [this.institusi_id, this.fakultas_id, this.prodi_id].filter(id => id != null);
            if (levels.length !== 1) {
                throw new Error('Bahan Kajian must belong to exactly one organizational level (institusi, fakultas, or prodi)');
            }
            if (this.level === 'institusi' && !this.institusi_id) throw new Error('Institusi level BK must have institusi_id');
            if (this.level === 'fakultas' && !this.fakultas_id) throw new Error('Fakultas level BK must have fakultas_id');
            if (this.level === 'prodi' && !this.prodi_id) throw new Error('Prodi level BK must have prodi_id');
        }
    }
});

export default BahanKajian;
