import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define('Attendance', {
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
    rps_pertemuan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rps_pertemuan',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('Hadir', 'Izin', 'Sakit', 'Alpa'),
        allowNull: false,
        defaultValue: 'Hadir',
        comment: 'Hadir=Present, Izin=Excused, Sakit=Sick, Alpa=Unexcused'
    },
    marked_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When attendance was marked'
    },
    marked_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Dosen who marked attendance'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional notes (e.g., reason for absence)'
    }
}, {
    tableName: 'attendance',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['mahasiswa_id', 'rps_pertemuan_id']
        },
        {
            fields: ['rps_pertemuan_id']
        },
        {
            fields: ['status']
        }
    ]
});

export default Attendance;
