import sequelize from "../config/database.js";
import { seedOrganizationStructure } from "./institutionData.js";
import {
  seedInstitutCPL,
  seedFakultasCPL,
  seedProdiCPL,
  seedProfilLulusan,
} from "./cplHierarchy.js";
import { seedBahanKajian } from "./kurikulum.js";
import { seedMataKuliah, seedCPMK, seedMahasiswa } from "./masterData.js";
import { seedUsers, seedDosenAssignments } from "./userData.js";
import { seedDummyData } from "./dummyData.js";

const runSeeder = async () => {
  try {
    console.log("🌱 Starting database seeding for Institut Mahardika...\n");

    // Sync database (force: true akan DROP semua table dan recreate)
    await sequelize.sync({ force: true });
    console.log("✅ Database synchronized\n");

    // ========== PHASE 1: ORGANIZATIONAL STRUCTURE ==========
    console.log("📊 PHASE 1: Creating Organizational Structure");
    console.log("─".repeat(60));

    const { institusi, fakultasList, prodiList } =
      await seedOrganizationStructure();
    const prodiInformatika = prodiList.find((p) => p.kode === "IF");

    // ========== PHASE 2: CPL HIERARCHY ==========
    console.log("\n📚 PHASE 2: Creating CPL Hierarchy");
    console.log("─".repeat(60));

    // Institut-level CPLs (mandatory for all)
    const cplInstitut = await seedInstitutCPL(institusi.id);

    // Fakultas-level CPLs (mandatory per faculty)
    const cplFakultas = await seedFakultasCPL(fakultasList);

    // Prodi-level CPLs (Informatika as example)
    const plInformatika = await seedProfilLulusan(prodiInformatika.id);
    const cplProdi = await seedProdiCPL(prodiList, plInformatika);

    const allCPL = [...cplInstitut, ...cplFakultas, ...cplProdi];

    // ========== PHASE 3: CURRICULUM DATA ==========
    console.log("\n📖 PHASE 3: Creating Curriculum Data");
    console.log("─".repeat(60));

    // Bahan Kajian
    await seedBahanKajian(prodiInformatika.id);

    // Mata Kuliah (for Informatika)
    const fakultasTeknik = fakultasList.find((f) => f.kode === "FT"); // Assuming Kode FT for Teknik, or based on index
    const fakultasTeknikId = fakultasTeknik?.id || fakultasList[0].id;

    const mkList = await seedMataKuliah(
      prodiInformatika.id,
      institusi.id,
      fakultasTeknikId,
    );

    // CPMK Templates (using prodi-level CPL)
    console.log("\n📚 Seeding CPMK Templates...");
    await seedCPMK(cplProdi, mkList);

    // ========== PHASE 4: USERS & ASSIGNMENTS ==========
    console.log("\n👥 PHASE 4: Creating Users & Assignments");
    console.log("─".repeat(60));

    const users = await seedUsers(institusi.id, fakultasList, prodiList);

    // Lecturer assignments (including cross-faculty)
    await seedDosenAssignments(users, mkList);

    // ========== PHASE 4.5: ACADEMIC YEARS & ACTIVE COURSES ==========
    await seedAcademicYears();

    // ========== PHASE 5: STUDENTS ==========
    console.log("\n🎓 PHASE 5: Creating Student Data");
    console.log("─".repeat(60));

    await seedMahasiswa(prodiInformatika.id);

    // Dummy Data (Assignments & Enrollments)
    await seedDummyData();

    // ========== SUMMARY ==========
    console.log("\n" + "═".repeat(60));
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("═".repeat(60));
    console.log("\n📊 Summary:");
    console.log("   🏛️  Organizational Structure:");
    console.log("       - 1 Institut (Institut Mahardika)");
    console.log("       - 2 Fakultas (Teknik, Kesehatan)");
    console.log("       - 5 Prodi (IF, KEP, KM, KEB, RMIK)");
    console.log("\n   📚 CPL Hierarchy:");
    console.log(
      `       - ${cplInstitut.length} Institut-level CPLs (mandatory for all)`,
    );
    console.log(
      `       - ${cplFakultas.length} Fakultas-level CPLs (mandatory per faculty)`,
    );
    console.log(`       - ${cplProdi.length} Prodi-level CPLs (Informatika)`);
    console.log(`       - Total: ${allCPL.length} CPLs`);
    console.log("\n   📖 Curriculum:");
    console.log("       - 33 Bahan Kajian");
    console.log(`       - ${mkList.length} Mata Kuliah (Informatika)`);
    console.log("       - 80+ CPMK Templates");
    console.log("\n   👥 Users:");
    console.log("       - 1 Admin Institusi");
    console.log("       - 2 Dekan (per Fakultas)");
    console.log("       - 5 Kaprodi (per Prodi)");
    console.log("       - 9 Dosen (across faculties)");
    console.log("       - 30 Mahasiswa (Informatika)");
    console.log("\n🔐 Default Login Credentials:");
    console.log("   Password for all: password123");
    console.log("\n   Admin Institusi:");
    console.log("      - admin_mahardika");
    console.log("\n   Dekan:");
    console.log("      - dekan_teknik");
    console.log("      - dekan_kesehatan");
    console.log("\n   Kaprodi:");
    console.log("      - kaprodi_informatika");
    console.log("      - kaprodi_keperawatan");
    console.log("      - kaprodi_kesmas");
    console.log("      - kaprodi_kebidanan");
    console.log("      - kaprodi_rmik");
    console.log("\n   Dosen (sample):");
    console.log("      - dosen_andi (Informatika)");
    console.log("      - dosen_siti (Informatika)");
    console.log("      - dosen_ani (Keperawatan)");
    console.log("      - dosen_faisal (RMIK - cross-faculty assignment)");
    console.log("\n" + "═".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    console.error(error.stack);
    process.exit(1);
  }
};

runSeeder();
