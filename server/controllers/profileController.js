import UserProfile from "../models/UserProfile.js";
import User from "../models/User.js";

// Get Profile Details
export const getProfileDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ where: { user_id: userId } });

    if (!profile) {
      return res.status(404).json({ message: "Profile details not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create or Update Profile
export const upsertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      profile_type,
      phone,
      address,
      nidn,
      jabatan_fungsional,
      pendidikan_terakhir,
      bidang_keahlian,
      homebase,
      status_kepegawaian, // Dosen
      nim,
      angkatan,
      status_mahasiswa, // Mahasiswa
    } = req.body;

    let profile = await UserProfile.findOne({ where: { user_id: userId } });

    if (profile) {
      // Update
      if (phone) profile.phone = phone;
      if (address) profile.address = address;

      if (profile_type === "dosen") {
        if (nidn) profile.nidn = nidn;
        if (jabatan_fungsional) profile.jabatan_fungsional = jabatan_fungsional;
        if (pendidikan_terakhir)
          profile.pendidikan_terakhir = pendidikan_terakhir;
        if (bidang_keahlian) profile.bidang_keahlian = bidang_keahlian;
        if (homebase) profile.homebase = homebase;
        if (status_kepegawaian) profile.status_kepegawaian = status_kepegawaian;
      } else if (profile_type === "mahasiswa") {
        if (nim) profile.nim = nim;
        if (angkatan) profile.angkatan = angkatan;
        if (status_mahasiswa) profile.status_mahasiswa = status_mahasiswa;
      }

      await profile.save();
    } else {
      // Create
      profile = await UserProfile.create({
        user_id: userId,
        profile_type:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? "dosen"
            : "mahasiswa", // Default based on role
        phone,
        address,
        nidn:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? nidn
            : null,
        jabatan_fungsional:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? jabatan_fungsional
            : null,
        pendidikan_terakhir:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? pendidikan_terakhir
            : null,
        bidang_keahlian:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? bidang_keahlian
            : null,
        homebase:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? homebase
            : null,
        status_kepegawaian:
          req.user.role === "dosen" || req.user.role === "kaprodi"
            ? status_kepegawaian
            : null,
        nim: req.user.role === "mahasiswa" ? nim : null,
        angkatan: req.user.role === "mahasiswa" ? angkatan : null,
        status_mahasiswa:
          req.user.role === "mahasiswa" ? status_mahasiswa : null,
      });
    }

    res.json({ message: "Profile details saved successfully", profile });
  } catch (error) {
    console.error("Error saving profile details:", error);
    console.error("Validation errors:", error.errors); // Log validation errors specifically
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      details: error.errors,
    });
  }
};
