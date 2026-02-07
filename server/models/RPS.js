import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RPS = sequelize.define('RPS', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mata_kuliah_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to DosenAssignment (null for templates)'
    },
    dosen_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to User with role dosen'
    },
    is_template: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if this is a prodi template RPS, false for actual implementation'
    },
    revision: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Revision number (1, 2, 3...)'
    },
    template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to RPS template that this instance was created from'
    },
    semester: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Ganjil or Genap (null for templates)'
    },
    tahun_ajaran: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'e.g., 2025/2026 (null for templates)'
    },
    semester_akademik: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'e.g. 2026/2027 Ganjil (computed from tahun_ajaran + semester)'
    },
    bobot_sks: {
        type: DataTypes.JSON, // { t: 2, p: 1 }
        allowNull: true
    },
    rumpun_mk: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pengembang_rps: {
        type: DataTypes.STRING,
        allowNull: true
    },
    koordinator_rumpun_mk: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ketua_prodi: {
        type: DataTypes.STRING,
        allowNull: true
    },
    jumlah_pertemuan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 16
    },
    capaian_pembelajaran: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Overall learning outcome description'
    },
    deskripsi_mk: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    referensi: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Pustaka/bibliografi'
    },
    pustaka_utama: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    pustaka_pendukung: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    media_software: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    media_hardware: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    dosen_pengampu_list: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Array of lecturer names'
    },
    mk_syarat: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ambang_batas_mhs: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ambang_batas_mk: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cpl_ids: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Selected CPL IDs'
    },
    cpmk_ids: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Selected CPMK IDs'
    },
    sub_cpmk_list: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'List of Sub-CPMKs: [{id, kode, deskripsi, cpmk_id}]'
    },
    metode_penilaian: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'List of assessment methods: [{type: "Rubrik", name: "...", scales: [...]}]'
    },
    status: {
        type: DataTypes.ENUM('draft', 'pending', 'submitted', 'approved', 'revision', 'rejected'),
        defaultValue: 'draft'
    },
    catatan_approval: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Feedback from approver (Kaprodi/Dekan)'
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Kaprodi user ID who approved'
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'rps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default RPS;
