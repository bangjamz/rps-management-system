import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MKAktif = sequelize.define(
  "MKAktif",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mata_kuliah_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "mata_kuliah",
        key: "id",
      },
      comment: "Reference to mata kuliah",
    },
    prodi_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "prodi",
        key: "id",
      },
      comment: "Program studi for this offering",
    },
    tahun_akademik_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "academic_years",
        key: "id",
      },
      comment: "Active academic year",
    },
    semester: {
      type: DataTypes.ENUM("Ganjil", "Genap"),
      allowNull: false,
      // comment: 'Semester offering' // Commented for Sequelize 6.x compatibility
    },
    angkatan_target: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment:
        'Array of angkatan years that can see this MK, e.g. ["2022", "2023"]',
    },
    dosen_pengampu_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "Assigned lecturer for this offering",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Whether this offering is currently active",
    },
  },
  {
    tableName: "mk_aktifs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default MKAktif;
