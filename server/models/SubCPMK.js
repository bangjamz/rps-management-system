import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SubCPMK = sequelize.define('SubCPMK', {
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
        comment: 'For institut-level SubCPMK'
    },
    fakultas_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For fakultas-level SubCPMK'
    },
    prodi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Prodi ID for filtering and uniqueness'
    },
    cpmk_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    kode_sub_cpmk: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Internal code with prefix, e.g., IF-SCPMK01'
    },
    kode_tampilan: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Display code for RPS, e.g., SCPMK01'
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    indikator: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bobot_nilai: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Bobot persentase untuk penilaian'
    },
    is_template: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Sub-CPMK mostly created by dosen, not from master'
    }
}, {
    tableName: 'sub_cpmk',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['kode_sub_cpmk']
        },
        {
            unique: true,
            fields: ['kode_tampilan', 'prodi_id'],
            name: 'unique_subcpmk_display_per_prodi'
        },
        {
            fields: ['cpmk_id']
        }
    ],
    validate: {
        hasOneOrganizationLevel() {
            const levels = [this.institusi_id, this.fakultas_id, this.prodi_id].filter(id => id != null);
            if (levels.length !== 1) {
                throw new Error('SubCPMK must belong to exactly one organizational level (institusi, fakultas, or prodi)');
            }
            if (this.level === 'institusi' && !this.institusi_id) throw new Error('Institusi level SubCPMK must have institusi_id');
            if (this.level === 'fakultas' && !this.fakultas_id) throw new Error('Fakultas level SubCPMK must have fakultas_id');
            if (this.level === 'prodi' && !this.prodi_id) throw new Error('Prodi level SubCPMK must have prodi_id');
        }
    }
});

export default SubCPMK;
