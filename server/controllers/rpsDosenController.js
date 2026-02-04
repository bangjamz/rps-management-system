import {
    RPS,
    RPSPertemuan,
    MataKuliah,
    CPL,
    CPMK,
    SubCPMK,
    Prodi,
    User
} from '../models/index.js';

import { Op } from 'sequelize';

/**
 * Get curriculum tree (CPL -> CPMK -> Sub-CPMK) for a prodi
 * Optional query: ?courseId=123 to filter CPMKs by course
 */
export const getCurriculumTree = async (req, res) => {
    try {
        const { prodiId } = req.params;
        const { courseId } = req.query;

        // Build include conditions
        const cpmkInclude = {
            model: CPMK,
            as: 'cpmk',
            required: false,
            include: [
                {
                    model: SubCPMK,
                    as: 'sub_cpmk',
                    required: false
                }
            ]
        };

        // If courseId provided, filter CPMKs by this course OR templates
        if (courseId) {
            cpmkInclude.where = {
                [Op.or]: [
                    { mata_kuliah_id: courseId },
                    { is_template: true }
                ]
            };
        }

        const cpls = await CPL.findAll({
            where: { prodi_id: prodiId },
            include: [cpmkInclude],
            order: [['kode_cpl', 'ASC']]
        });

        // Flatten to match frontend expected format
        const formattedCpls = cpls.map(cpl => ({
            id: cpl.id,
            kode: cpl.kode_cpl,
            deskripsi: cpl.deskripsi,
            cpmks: (cpl.cpmk || []).map(cpmk => ({
                id: cpmk.id,
                kode: cpmk.kode_cpmk,
                deskripsi: cpmk.deskripsi,
                mata_kuliah_id: cpmk.mata_kuliah_id,
                subCpmks: cpmk.sub_cpmk || []
            }))
        }));

        res.json({ cpls: formattedCpls });
    } catch (error) {
        console.error('Error fetching curriculum tree:', error);
        res.status(500).json({ message: 'Failed to fetch curriculum tree', error: error.message });
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
            rumpun_mk,
            pengembang_rps,
            ketua_prodi,
            cpl_ids,
            cpmk_ids
        } = req.body;

        console.log('Creating RPS with data:', { mata_kuliah_id, semester, tahun_ajaran, user_id: req.user?.id });

        // Verify course exists
        const mataKuliah = await MataKuliah.findByPk(mata_kuliah_id);
        if (!mataKuliah) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check for duplicate - only if not allowing revisions
        const existing = await RPS.findOne({
            where: {
                mata_kuliah_id,
                semester,
                tahun_ajaran
            }
        });

        if (existing) {
            // Instead of error, return existing RPS for editing
            return res.status(200).json({
                message: 'RPS already exists, returning existing',
                rps: existing,
                isExisting: true
            });
        }

        // Create RPS - use req.user.id directly (RPS.dosen_id references User table)
        const rps = await RPS.create({
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            deskripsi_mk: deskripsi_mk || '',
            rumpun_mk: rumpun_mk || '',
            pengembang_rps: pengembang_rps || req.user?.nama_lengkap || '',
            ketua_prodi: ketua_prodi || '',
            dosen_id: req.user.id,  // Use User ID directly
            status: 'draft'
        });

        console.log('RPS created successfully:', rps.id);

        res.status(201).json({
            message: 'RPS created successfully',
            rps
        });
    } catch (error) {
        console.error('Error creating RPS:', error);
        res.status(500).json({
            message: 'Failed to create RPS',
            error: error.message,
            details: error.errors?.map(e => e.message) || []
        });
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

        // Check if Dosen owns this RPS, OR if user is Kaprodi/Dekan
        // Allow if user is DOSEN and owns it, OR if user is KAPRODI (admin control)
        const isOwner = rps.dosen_id === req.user.dosen?.id;
        const canEdit = isOwner || ['kaprodi', 'dekan'].includes(req.user.role);

        if (!canEdit) {
            return res.status(403).json({ message: 'You do not have permission to edit this RPS' });
        }

        // Can only edit if Draft
        if (rps.status.toLowerCase() !== 'draft') {
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

        // Check ownership or permission
        const isOwner = rps.dosen_id === req.user.id;
        const canEdit = isOwner || ['kaprodi', 'dekan', 'admin'].includes(req.user.role);

        if (!canEdit) {
            return res.status(403).json({ message: 'You do not have permission to edit this RPS' });
        }

        // Can only edit if Draft
        if (rps.status && rps.status.toLowerCase() !== 'draft') {
            return res.status(400).json({
                message: 'Can only edit RPS in Draft status'
            });
        }

        const results = [];

        for (const item of pertemuan) {
            const {
                minggu_ke,
                sub_cpmk,
                indikator,
                materi,
                metode_pembelajaran,
                bentuk_pembelajaran,
                link_daring,
                bentuk_evaluasi,
                bobot_penilaian
            } = item;

            const [pertemuanRecord, created] = await RPSPertemuan.findOrCreate({
                where: {
                    rps_id: rpsId,
                    minggu_ke: minggu_ke
                },
                defaults: {
                    sub_cpmk,
                    indikator,
                    materi,
                    metode_pembelajaran,
                    bentuk_pembelajaran: Array.isArray(bentuk_pembelajaran) ? bentuk_pembelajaran : [],
                    link_daring,
                    bentuk_evaluasi,
                    bobot_penilaian
                }
            });

            if (!created) {
                // Update existing
                await pertemuanRecord.update({
                    sub_cpmk,
                    indikator,
                    materi,
                    metode_pembelajaran,
                    bentuk_pembelajaran: Array.isArray(bentuk_pembelajaran) ? bentuk_pembelajaran : [],
                    link_daring,
                    bentuk_evaluasi,
                    bobot_penilaian
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
        res.status(500).json({ message: 'Failed to save pertemuan', error: error.message });
    }
};

/**
 * Get courses for RPS creation dropdown
 * - Dosen: Get courses in their prodi
 * - Kaprodi: Get all courses in their prodi
 */
export const getDosenCourses = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Prodi, as: 'prodi' }]
        });

        if (!user.prodi_id) {
            return res.status(404).json({ message: 'User has no prodi assigned' });
        }

        // Get all courses in user's prodi
        const courses = await MataKuliah.findAll({
            where: { prodi_id: user.prodi_id },
            order: [['kode_mk', 'ASC']]
        });

        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
};

/**
 * Create new CPMK (Dosen/Kaprodi)
 * POST /api/rps/curriculum/cpmk
 */
export const createCPMK = async (req, res) => {
    try {
        const { mata_kuliah_id, cpl_id, kode_cpmk, deskripsi, is_template } = req.body;

        const cpmk = await CPMK.create({
            mata_kuliah_id,
            cpl_id,
            kode_cpmk,
            deskripsi,
            is_template: is_template || false,
            created_by: req.user.id
        });

        res.status(201).json(cpmk);
    } catch (error) {
        console.error('Error creating CPMK:', error);
        res.status(500).json({ message: 'Failed to create CPMK', error: error.message });
    }
};

/**
 * Create new Sub-CPMK
 * POST /api/rps/curriculum/sub-cpmk
 */
export const createSubCPMK = async (req, res) => {
    try {
        const { cpmk_id, kode, deskripsi } = req.body;

        const subCpmk = await SubCPMK.create({
            cpmk_id,
            kode,
            deskripsi
        });

        res.status(201).json(subCpmk);
    } catch (error) {
        console.error('Error creating Sub-CPMK:', error);
        res.status(500).json({ message: 'Failed to create Sub-CPMK', error: error.message });
    }
};
