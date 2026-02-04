import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mahasiswa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'mahasiswa',
            key: 'id'
        }
    },
    mata_kuliah_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'mata_kuliah',
            key: 'id'
        }
    },
    semester: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Ganjil or Genap'
    },
    tahun_ajaran: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Academic year, e.g., 2025/2026'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Dropped', 'Completed'),
        allowNull: false,
        defaultValue: 'Active',
        comment: 'Active=currently enrolled, Dropped=withdrawn, Completed=finished'
    },
    enrolled_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    dropped_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    final_grade: {
        type: DataTypes.STRING(5),
        allowNull: true,
        comment: 'Final grade letter (A, B, C, etc.) - linked from FinalGrade table'
    },
    final_ip: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Final IP (0.00-4.00) - linked from FinalGrade table'
    }
}, {
    tableName: 'enrollment',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['mahasiswa_id', 'mata_kuliah_id', 'semester', 'tahun_ajaran'],
            name: 'unique_enrollment'
        },
        {
            fields: ['mata_kuliah_id']
        },
        {
            fields: ['mahasiswa_id']
        },
        {
            fields: ['status']
        }
    ]
});

export default Enrollment;
