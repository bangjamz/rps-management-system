import {
    RPS,
    RPSPertemuan,
    MataKuliah,
    Dosen,
    CPL,
    CPMK,
    SubCPMK,
    Prodi,
    User
} from '../models/index.js';

/**
 * Get curriculum tree (CPL -> CPMK -> Sub-CPMK) for a prodi
 */
export const getCurriculumTree = async (req, res) => {
    try {
        const { prodiId } = req.params;

        const cpls = await CPL.findAll({
            where: { prodi_id: prodiId },
            include: [
                {
                    model: CPMK,
                    as: 'cpmks',
                    include: [
                        {
                            model: SubCPMK,
                            as: 'subCPMKs'
                        }
                    ]
                }
            ],
            order: [['kode', 'ASC']]
        });

        res.json({ cpls });
    } catch (error) {
        console.error('Error fetching curriculum tree:', error);
        res.status(500).json({ message: 'Failed to fetch curriculum tree' });
    }
};

/**
 * Create new RPS (Dosen only)
 */
export const createRPS = async (req, res) => {
    try {
        const {
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            deskripsi_mk,
            cpl_ids,
            cpmk_ids
        } = req.body;

        // Verify course exists
        const mataKuliah = await MataKuliah.findByPk(mata_kuliah_id);
        if (!mataKuliah) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check for duplicate
        const existing = await RPS.findOne({
            where: {
                mata_kuliah_id,
                semester,
                tahun_ajaran
            }
        });

        if (existing) {
            return res.status(400).json({
                message: 'RPS already exists for this course/semester/year'
            });
        }

        // Create RPS
        const rps = await RPS.create({
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            deskripsi_mk,
            dosen_pengampu_id: req.user.dosen?.id || null,
            status: 'Draft'
        });

        // TODO: Link CPLs and CPMKs (if using junction table)
        // For now, assume they're tracked via pertemuan's sub_cpmk_id

        res.status(201).json({
            message: 'RPS created successfully',
            rps
        });
    } catch (error) {
        console.error('Error creating RPS:', error);
        res.status(500).json({ message: 'Failed to create RPS' });
    }
};

/**
 * Update RPS (Dosen only, if status = Draft)
 */
export const updateRPS = async (req, res) => {
    try {
        const { rpsId } = req.params;
        const { deskripsi_mk, cpl_ids, cpmk_ids } = req.body;

        const rps = await RPS.findByPk(rpsId);
        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Check if Dosen owns this RPS
        if (rps.dosen_pengampu_id !== req.user.dosen?.id) {
            return res.status(403).json({ message: 'You can only edit your own RPS' });
        }

        // Can only edit if Draft
        if (rps.status !== 'Draft') {
            return res.status(400).json({
                message: 'Can only edit RPS in Draft status'
            });
        }

        await rps.update({ deskripsi_mk });

        res.json({
            message: 'RPS updated successfully',
            rps
        });
    } catch (error) {
        console.error('Error updating RPS:', error);
        res.status(500).json({ message: 'Failed to update RPS' });
    }
};

/**
 * Bulk create/update pertemuan for an RPS
 */
export const bulkUpsertPertemuan = async (req, res) => {
    try {
        const { rpsId } = req.params;
        const { pertemuan } = req.body; // Array of pertemuan objects

        if (!Array.isArray(pertemuan)) {
            return res.status(400).json({ message: 'pertemuan must be an array' });
        }

        const rps = await RPS.findByPk(rpsId);
        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Check ownership
        if (rps.dosen_pengampu_id !== req.user.dosen?.id) {
            return res.status(403).json({ message: 'You can only edit your own RPS' });
        }

        // Can only edit if Draft
        if (rps.status !== 'Draft') {
            return res.status(400).json({
                message: 'Can only edit RPS in Draft status'
            });
        }

        const results = [];

        for (const item of pertemuan) {
            const {
                pertemuan_ke,
                tanggal,
                topik,
                sub_cpmk_id,
                metode_pembelajaran,
                materi,
                bentuk_evaluasi
            } = item;

            const [pertemuanRecord, created] = await RPSPertemuan.findOrCreate({
                where: {
                    rps_id: rpsId,
                    pertemuan_ke
                },
                defaults: {
                    tanggal,
                    topik,
                    sub_cpmk_id,
                    metode_pembelajaran,
                    materi,
                    bentuk_evaluasi
                }
            });

            if (!created) {
                // Update existing
                await pertemuanRecord.update({
                    tanggal,
                    topik,
                    sub_cpmk_id,
                    metode_pembelajaran,
                    materi,
                    bentuk_evaluasi
                });
            }

            results.push(pertemuanRecord);
        }

        res.json({
            message: `${results.length} pertemuan records saved`,
            pertemuan: results
        });
    } catch (error) {
        console.error('Error bulk upserting pertemuan:', error);
        res.status(500).json({ message: 'Failed to save pertemuan' });
    }
};

/**
 * Get Dosen's courses (for RPS creation dropdown)
 */
export const getDosenCourses = async (req, res) => {
    try {
        const dosenId = req.user.dosen?.id;
        if (!dosenId) {
            return res.status(404).json({ message: 'Dosen profile not found' });
        }

        // TODO: Get courses via dosen_assignment table
        // For now, return all courses in Dosen's prodi
        const dosen = await Dosen.findByPk(dosenId);
        const courses = await MataKuliah.findAll({
            where: { prodi_id: dosen.prodi_id },
            order: [['kode_mk', 'ASC']]
        });

        res.json(courses);
    } catch (error) {
        console.error('Error fetching dosen courses:', error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
};
