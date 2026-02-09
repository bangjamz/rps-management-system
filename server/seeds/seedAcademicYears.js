import {
  AcademicYear,
  MKAktif,
  DosenAssignment,
  MataKuliah,
  User,
} from "../models/index.js";
import { Op } from "sequelize";

export const seedAcademicYears = async () => {
  console.log("\n📅 Seeding Academic Years & Active Courses...");

  try {
    const yearName = "2025/2026";
    const semester = "Ganjil";

    // 1. Deactivate all existing academic years
    await AcademicYear.update({ is_active: false }, { where: {} });

    // 2. Create or Update Active Academic Year
    const [academicYear, created] = await AcademicYear.findOrCreate({
      where: { name: yearName, active_semester: semester },
      defaults: {
        is_active: true,
      },
    });

    if (!created) {
      await academicYear.update({ is_active: true });
      console.log(`   ✅ Activated Academic Year: ${yearName} ${semester}`);
    } else {
      console.log(`   ✅ Created Academic Year: ${yearName} ${semester}`);
    }

    // 3. Sync DosenAssignment to MKAktif
    // Purpose: Ensure that courses assigned to lecturers appear in the active course list
    const assignments = await DosenAssignment.findAll({
      where: {
        is_active: true,
        tahun_ajaran: yearName,
        semester: semester,
      },
    });

    if (assignments.length === 0) {
      console.log(
        "   ⚠️ No assignments found to migrate. Skipping MKAktif creation.",
      );
      return;
    }

    console.log(
      `   🔄 Migrating ${assignments.length} assignments to Active Courses...`,
    );
    let count = 0;

    for (const assign of assignments) {
      const mk = await MataKuliah.findByPk(assign.mata_kuliah_id);
      if (!mk) continue;

      const [mkAktif, mkCreated] = await MKAktif.findOrCreate({
        where: {
          mata_kuliah_id: assign.mata_kuliah_id,
          tahun_akademik_id: academicYear.id,
          semester: semester,
          prodi_id: mk.prodi_id,
        },
        defaults: {
          dosen_pengampu_id: assign.dosen_id,
          is_active: true,
          // Default target audiences (modify as needed)
          angkatan_target: [2023, 2024, 2025, 2026],
        },
      });

      if (mkCreated) count++;
    }

    console.log(
      `   ✅ Created ${count} Active Courses (MKAktif) based on assignments.`,
    );
  } catch (error) {
    console.error("   ❌ Error seeding Academic Years:", error);
    throw error;
  }
};
