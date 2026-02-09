import {
  MKAktif,
  MataKuliah,
  Prodi,
  AcademicYear,
  User,
} from "../models/index.js";
import { Op } from "sequelize";

// Get all active courses for a prodi/semester
export const getMKAktif = async (req, res) => {
  try {
    const { prodi_id, tahun_akademik_id, semester } = req.query;

    const where = {};
    if (prodi_id) where.prodi_id = prodi_id;
    if (tahun_akademik_id) where.tahun_akademik_id = tahun_akademik_id;
    if (semester) where.semester = semester;

    const mkAktifs = await MKAktif.findAll({
      where,
      include: [
        { model: MataKuliah, as: "mata_kuliah" },
        { model: Prodi, as: "prodi" },
        { model: AcademicYear, as: "tahun_akademik" },
        {
          model: User,
          as: "dosen_pengampu",
          attributes: ["id", "nama_lengkap", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(mkAktifs);
  } catch (error) {
    console.error("Error fetching MK Aktif:", error);
    res.status(500).json({ message: "Failed to fetch active courses" });
  }
};

// Get courses for mahasiswa (filtered by their prodi and angkatan)
export const getMyMKAktif = async (req, res) => {
  try {
    const user = req.user;

    if (!user.prodi_id) {
      return res.status(400).json({ message: "User has no prodi assigned" });
    }

    // Get active academic year
    const activeYear = await AcademicYear.findOne({
      where: { is_active: true },
    });
    if (!activeYear) {
      return res.status(404).json({ message: "No active academic year found" });
    }

    const mkAktifs = await MKAktif.findAll({
      where: {
        prodi_id: user.prodi_id,
        tahun_akademik_id: activeYear.id,
        is_active: true,
        // Filter by angkatan - check if user's angkatan is in angkatan_target array
        ...(user.angkatan && {
          angkatan_target: { [Op.contains]: [parseInt(user.angkatan)] },
        }),
      },
      include: [
        { model: MataKuliah, as: "mata_kuliah" },
        {
          model: User,
          as: "dosen_pengampu",
          attributes: ["id", "nama_lengkap", "email"],
        },
      ],
    });

    res.json(mkAktifs);
  } catch (error) {
    console.error("Error fetching my MK Aktif:", error);
    res.status(500).json({ message: "Failed to fetch your courses" });
  }
};

// Create/Update MK Aktif (Kaprodi)
export const upsertMKAktif = async (req, res) => {
  try {
    const {
      mata_kuliah_id,
      prodi_id,
      tahun_akademik_id,
      semester,
      angkatan_target,
      dosen_pengampu_id,
      is_active,
    } = req.body;

    // Check if already exists
    const existing = await MKAktif.findOne({
      where: { mata_kuliah_id, prodi_id, tahun_akademik_id, semester },
    });

    let mkAktif;
    if (existing) {
      await existing.update({
        angkatan_target,
        dosen_pengampu_id,
        is_active: is_active !== undefined ? is_active : true,
      });
      mkAktif = existing;
    } else {
      mkAktif = await MKAktif.create({
        mata_kuliah_id,
        prodi_id,
        tahun_akademik_id,
        semester,
        angkatan_target: angkatan_target || [],
        dosen_pengampu_id,
        is_active: is_active !== undefined ? is_active : true,
      });
    }

    res.json({ message: existing ? "Updated" : "Created", mkAktif });
  } catch (error) {
    console.error("Error upserting MK Aktif:", error);
    res.status(500).json({ message: "Failed to save active course" });
  }
};

// Bulk assign courses to angkatan
export const bulkAssignAngkatan = async (req, res) => {
  try {
    const { mk_aktif_ids, angkatan } = req.body;

    if (!mk_aktif_ids || !Array.isArray(mk_aktif_ids) || !angkatan) {
      return res
        .status(400)
        .json({ message: "mk_aktif_ids array and angkatan required" });
    }

    const updated = await Promise.all(
      mk_aktif_ids.map(async (id) => {
        const mkAktif = await MKAktif.findByPk(id);
        if (mkAktif) {
          const currentAngkatan = mkAktif.angkatan_target || [];
          if (!currentAngkatan.includes(angkatan)) {
            mkAktif.angkatan_target = [...currentAngkatan, angkatan];
            await mkAktif.save();
          }
          return mkAktif;
        }
      }),
    );

    res.json({
      message: `Assigned ${updated.length} courses to angkatan ${angkatan}`,
    });
  } catch (error) {
    console.error("Error bulk assigning angkatan:", error);
    res.status(500).json({ message: "Failed to bulk assign" });
  }
};

// Delete MK Aktif
export const deleteMKAktif = async (req, res) => {
  try {
    const { id } = req.params;
    const mkAktif = await MKAktif.findByPk(id);

    if (!mkAktif) {
      return res.status(404).json({ message: "Active course not found" });
    }

    await mkAktif.destroy();
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting MK Aktif:", error);
    res.status(500).json({ message: "Failed to delete active course" });
  }
};
