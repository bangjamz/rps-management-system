import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RPSPertemuan = sequelize.define('RPSPertemuan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rps_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    minggu_ke: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sampai_minggu_ke: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'If set, this pertemuan covers range from minggu_ke to sampai_minggu_ke'
    },
    sub_cpmk_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID linking to RPS.sub_cpmk_list'
    },
    sub_cpmk: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Sub-CPMK untuk pertemuan ini'
    },
    indikator: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    materi: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Materi pembelajaran'
    },
    metode_pembelajaran: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Diskusi, presentasi, praktikum, dll'
    },
    bentuk_pembelajaran: {
        type: DataTypes.JSON, // Changed to JSON to store array ['tatap_muka', 'daring']
        defaultValue: [],
        comment: 'Array of selected methods: tatap_muka, daring, etc.'
    },
    link_daring: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Link Zoom/GMeet if daring is selected'
    },
    nama_lms: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nama LMS (e.g. sibeda.mahardika.ac.id)'
    },
    link_meet_platform: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Platform: Google Meet, Zoom, or Manual'
    },
    jenis_pertemuan: {
        type: DataTypes.ENUM('regular', 'uts', 'uas', 'praktikum', 'seminar'),
        defaultValue: 'regular'
    },
    kriteria_penilaian: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Deskripsi kriteria penilaian'
    },
    penugasan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bentuk_evaluasi: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Jenis evaluasi: Tes Tertulis, Kuis, Proyek, dll'
    },
    bobot_penilaian: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Bobot dalam persen'
    },
    referensi: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'rps_pertemuan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['rps_id', 'minggu_ke']
        }
    ]
});

export default RPSPertemuan;
