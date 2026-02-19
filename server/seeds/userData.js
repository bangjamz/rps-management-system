import { User, DosenAssignment } from "../models/index.js";
import bcrypt from "bcryptjs";

/**
 * Seed users with new role hierarchy for Institut Mahardika
 * Roles: admin_institusi, dekan (2), kaprodi (5), dosen (10+)
 */

export const seedUsers = async (institusiId, fakultasList, prodiList) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  const [fakultasTeknik, fakultasKesehatan] = fakultasList;

  // Map prodi by kode for easy access
  const prodiMap = {
    IF: prodiList.find((p) => p.kode === "IF"),
    KEP: prodiList.find((p) => p.kode === "KEP"),
    KM: prodiList.find((p) => p.kode === "KM"),
    KEB: prodiList.find((p) => p.kode === "KEB"),
    RMIK: prodiList.find((p) => p.kode === "RMIK"),
  };

  const users = await User.bulkCreate([
    // 1. Admin Institusi
    {
      username: "admin_mahardika",
      email: "admin@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "admin",
      nama_lengkap: "Dr. Ir. Supriyanto, M.M",
      institusi_id: institusiId,
      is_active: true,
    },

    // 2. Dekan Fakultas Teknik
    {
      username: "dekan_teknik",
      email: "dekan.teknik@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dekan",
      nama_lengkap: "Prof. Dr. Eng. Ahmad Fauzi, S.T, M.Eng",
      fakultas_id: fakultasTeknik.id,
      is_active: true,
    },

    // 3. Dekan Fakultas Kesehatan
    {
      username: "dekan_kesehatan",
      email: "dekan.kesehatan@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dekan",
      nama_lengkap: "Dr. dr. Siti Rahmawati, M.Kes",
      fakultas_id: fakultasKesehatan.id,
      is_active: true,
    },

    // 4-8. Kaprodi (5 prodi)
    {
      username: "kaprodi_informatika",
      email: "kaprodi.if@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "kaprodi",
      nama_lengkap: "Dr. Indra Surya Permana, MM., M.Kom.",
      prodi_id: prodiMap.IF.id,
      is_active: true,
    },
    {
      username: "kaprodi_keperawatan",
      email: "kaprodi.kep@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "kaprodi",
      nama_lengkap: "Ns. Dewi Lestari, S.Kep, M.Kep",
      prodi_id: prodiMap.KEP.id,
      is_active: true,
    },
    {
      username: "kaprodi_kesmas",
      email: "kaprodi.km@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "kaprodi",
      nama_lengkap: "Dr. Eko Prasetyo, SKM, M.Kes",
      prodi_id: prodiMap.KM.id,
      is_active: true,
    },
    {
      username: "kaprodi_kebidanan",
      email: "kaprodi.keb@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "kaprodi",
      nama_lengkap: "Hj. Fatimah Azzahra, SST, M.Keb",
      prodi_id: prodiMap.KEB.id,
      is_active: true,
    },
    {
      username: "kaprodi_rmik",
      email: "kaprodi.rmik@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "kaprodi",
      nama_lengkap: "Gilang Ramadhan, SKM, MARS",
      prodi_id: prodiMap.RMIK.id,
      is_active: true,
    },

    // DOSEN - Fakultas Teknik (Informatika)
    {
      username: "dosen_andi",
      email: "andi.wijaya@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Andi Wijaya, S.Kom, M.T",
      nidn: "0312088901",
      telepon: "081234567801",
      prodi_id: prodiMap.IF.id,
      is_active: true,
    },
    {
      username: "dosen_siti",
      email: "siti.nurhaliza@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Siti Nurhaliza, S.Kom, M.Kom",
      nidn: "0315089001",
      telepon: "081234567802",
      prodi_id: prodiMap.IF.id,
      is_active: true,
    },
    {
      username: "dosen_rudi",
      email: "rudi.hartono@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Rudi Hartono, S.T, M.Sc",
      nidn: "0318088801",
      telepon: "081234567803",
      prodi_id: prodiMap.IF.id,
      is_active: true,
    },

    // DOSEN - Fakultas Kesehatan (Keperawatan)
    {
      username: "dosen_ani",
      email: "ani.kusuma@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Ns. Ani Kusuma, S.Kep, M.Kep",
      nidn: "0320089101",
      telepon: "081234567804",
      prodi_id: prodiMap.KEP.id,
      is_active: true,
    },
    {
      username: "dosen_bambang",
      email: "bambang.suryanto@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Ns. Bambang Suryanto, S.Kep, M.Kep, Sp.KMB",
      nidn: "0325088701",
      telepon: "081234567805",
      prodi_id: prodiMap.KEP.id,
      is_active: true,
    },

    // DOSEN - Kesehatan Masyarakat
    {
      username: "dosen_clara",
      email: "clara.putri@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Clara Putri Andini, SKM, M.PH",
      nidn: "0322089201",
      telepon: "081234567806",
      prodi_id: prodiMap.KM.id,
      is_active: true,
    },
    {
      username: "dosen_david",
      email: "david.firmansyah@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "David Firmansyah, SKM, M.Kes",
      nidn: "0328088901",
      telepon: "081234567807",
      prodi_id: prodiMap.KM.id,
      is_active: true,
    },

    // DOSEN - Kebidanan
    {
      username: "dosen_endang",
      email: "endang.sri@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Endang Sri Wahyuni, SST, M.Keb",
      nidn: "0330088801",
      telepon: "081234567808",
      prodi_id: prodiMap.KEB.id,
      is_active: true,
    },

    // DOSEN - RMIK
    {
      username: "dosen_faisal",
      email: "faisal.ahmad@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "dosen",
      nama_lengkap: "Faisal Ahmad, S.Kom, MARS",
      nidn: "0335089001",
      telepon: "081234567809",
      prodi_id: prodiMap.RMIK.id,
      is_active: true,
    },

    // MAHASISWA - Fakultas Teknik (Informatika)
    {
      username: "mahasiswa_andi",
      email: "mahasiswa.andi@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "mahasiswa",
      nama_lengkap: "Andi Saputra",
      nim: "10115001",
      angkatan: 2023,
      telepon: "081234567901",
      prodi_id: prodiMap.IF.id,
      is_active: true,
    },
    {
      username: "mahasiswa_budi",
      email: "mahasiswa.budi@mahardika.ac.id",
      password_hash: hashedPassword,
      role: "mahasiswa",
      nama_lengkap: "Bagus Santoso",
      nim: "10115002",
      angkatan: 2023,
      telepon: "081234567902",
      prodi_id: prodiMap.IF.id,
      is_active: true,
    },
  ]);

  console.log("✅ Created users:");
  console.log("   - 1 Admin Institusi");
  console.log("   - 2 Dekan (Teknik, Kesehatan)");
  console.log("   - 5 Kaprodi (IF, KEP, KM, KEB, RMIK)");
  console.log("   - 9 Dosen (3 Teknik, 6 Kesehatan)");

  return users;
};

/**
 * Create sample lecturer assignments including cross-faculty examples
 */
export const seedDosenAssignments = async (users, mataKuliahList) => {
  // Find users by role
  const kaprodiIF = users.find((u) => u.username === "kaprodi_informatika");
  const kaprodiKEP = users.find((u) => u.username === "kaprodi_keperawatan");

  // Find dosen
  const dosenAndi = users.find((u) => u.username === "dosen_andi");
  const dosenSiti = users.find((u) => u.username === "dosen_siti");
  const dosenRudi = users.find((u) => u.username === "dosen_rudi");
  const dosenFaisal = users.find((u) => u.username === "dosen_faisal"); // RMIK dosen, for cross-faculty example

  // Get some sample MK (assuming Informatika prodi)
  const mkAlgoritma = mataKuliahList.find((mk) => mk.kode_mk === "MK06");
  const mkStrukturData = mataKuliahList.find((mk) => mk.kode_mk === "MK05");
  const mkBasisData = mataKuliahList.find((mk) => mk.kode_mk === "MK24");
  const mkPemrogWeb = mataKuliahList.find((mk) => mk.kode_mk === "MK10");
  const mkRME = mataKuliahList.find((mk) => mk.kode_mk === "MK49"); // Cross-faculty example

  const assignments = await DosenAssignment.bulkCreate([
    {
      dosen_id: dosenAndi.id,
      mata_kuliah_id: mkAlgoritma.id,
      assigned_by: kaprodiIF.id,
      semester: "Ganjil",
      tahun_ajaran: "2025/2026",
      catatan: "Dosen pengampu reguler",
      is_active: true,
    },
    {
      dosen_id: dosenSiti.id,
      mata_kuliah_id: mkStrukturData.id,
      assigned_by: kaprodiIF.id,
      semester: "Ganjil",
      tahun_ajaran: "2025/2026",
      catatan: "Dosen pengampu reguler",
      is_active: true,
    },
    {
      dosen_id: dosenRudi.id,
      mata_kuliah_id: mkBasisData.id,
      assigned_by: kaprodiIF.id,
      semester: "Ganjil",
      tahun_ajaran: "2025/2026",
      is_active: true,
    },
    {
      dosen_id: dosenSiti.id,
      mata_kuliah_id: mkPemrogWeb.id,
      assigned_by: kaprodiIF.id,
      semester: "Ganjil",
      tahun_ajaran: "2025/2026",
      catatan: "Multiple assignment untuk dosen yang sama",
      is_active: true,
    },
    // Cross-faculty example: RMIK dosen teaching in Informatika prodi
    {
      dosen_id: dosenFaisal.id,
      mata_kuliah_id: mkRME.id,
      assigned_by: kaprodiIF.id,
      semester: "Ganjil",
      tahun_ajaran: "2025/2026",
      catatan: "Cross-faculty assignment: Dosen RMIK mengajar di Informatika",
      is_active: true,
    },
  ]);

  console.log(
    `✅ Created ${assignments.length} lecturer assignments (including cross-faculty example)`,
  );
  return assignments;
};
