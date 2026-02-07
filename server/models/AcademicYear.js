
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AcademicYear = sequelize.define('AcademicYear', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    active_semester: {
        type: DataTypes.ENUM('Ganjil', 'Genap'),
        allowNull: true
    }
}, {
    tableName: 'academic_years',
    timestamps: true
});

export default AcademicYear;
